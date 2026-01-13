# System Integration Preparation Report

## 1. Overview

We have successfully retrieved the contract documents (`docs/DB.md`, `docs/ENV.md`) from the partner's repository (`Archiken/sun-frontend`) using the local environment's git credentials. This report outlines the discrepancies between the current local codebase (`running-gait`) and the partner's system contracts.

## 2. Environment Variables Analysis

### Partner Contract (`docs/ENV.md`)
The contract specifies a strict set of variables for Supabase and Cloudflare R2 only.

| Variable Name | Contract Status | Local Status | Discrepancy / Action |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required | ✅ Present | Aligned |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | ✅ Present | Aligned |
| `NEXT_PUBLIC_R2_PUBLIC_DOMAIN` | Required | ⚠️ Inferred | Code uses generic R2 envs. Verify. |
| `NEXT_PUBLIC_R2_PUBLIC_RESULTS` | Required | ✅ Present | Aligned |
| `R2_ENDPOINT` | Server Only | ✅ Present | Aligned |
| **`NEXT_PUBLIC_API_BASE_URL`** | **Prohibited** | ❌ **Present** | **VIOLATION**: Contract rule 5.2 prohibits mixing direct Supabase access with external API proxies. Current code relies on this for `/api/health` and potential backend logic. |
| `PYTHON_API_URL` | Undefined | ❌ **Present** | **VIOLATION**: Undocumented backend dependency (`localhost:8000`). Contract implies pure Frontend ↔ Supabase/R2 architecture. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`| Undefined | ⚠️ Present | Acceptable addition for Map feature (new capability). |

### Recommendations
1.  **Clarify Backend Role**: The existence of `PYTHON_API_URL` suggests a Python analysis server. The contract assumes a Serverless/R2 flow. We must confirm if we are allowed to keep this Python server or if logic must move to Supabase Edge Functions / Next.js API Routes.
2.  **Remove Proxy usage**: Refactor `/api/health` to check Supabase health directly, removing reliance on `NEXT_PUBLIC_API_BASE_URL` if it points to the Python server.

## 3. Database Schema Gap Analysis

### Partner Contract (`docs/DB.md`)
*   **Identity**: `auth.users` is source of truth.
*   **Core Tables**: `user_access`, `jobs`.
*   **Data Flow**: `jobs` table links directly to R2 paths (`original_video_r2`, `result_*_r2`).

### Local Implementation (`running-gait`)
*   **`user_access`**: ✅ Aligned.
*   **`jobs`**: ⚠️ Partial Alignment. Code in `upload-session` *tries* to insert into `jobs`, but writes to a `videos` table first.
*   **`videos`**: ❌ **Conflict**. Local code uses a dedicated `videos` table (+ `supabase.storage.from("videos")`) which is not in the contract.
    *   *Contract Way*: Upload to R2 -> Insert `jobs` row with path.
    *   *Local Way*: Upload to Supabase Storage -> Insert `videos` row -> Insert `jobs` row.
*   **`analysis_results`**: ❌ **Conflict**. Local code seemingly uses this table for results, whereas contract expects results to be fields in `jobs` (`result_json_r2`, etc.) pointing to R2 files.

### Critical Action Items
The data model for "Analysis" is fundamentally different.
*   **Current**: `User` -> `Video` (Table) -> `Job` (Table) -> `AnalysisResult` (Table).
*   **Target**: `User` -> `Job` (Table, contains R2 paths for video & results).

## 4. Migration Plan

To align with the partner:

1.  **Schema Migration**:
    *   Deprecate `videos` and `analysis_results` tables.
    *   Enhance `jobs` table to match contract (ensure columns `original_video_r2`, `result_json_r2` exist).
    *   Update `upload-session` API to write directly to `jobs`.

2.  **Storage Migration**:
    *   Contract emphasizes **R2**. Local code uses **Supabase Storage** (`supabase.storage.from("videos")`).
    *   *Decision Point*: Must we switch to R2 immediately? The contract lists R2 variables as "Required". If so, the `upload-session` logic needs a complete rewrite to use S3/R2 SDK instead of Supabase Storage SDK.

3.  **Code Updates**:
    *   Refactor `src/app/api/upload-session/route.ts` to remove `videos` table logic.
    *   Refactor `src/app/analyze/page-client.tsx` to read from `jobs` instead of `videos`/`analysis_results`.

## 5. Summary
The projects are **partially compatible** (Auth, basic Env) but **divergent** in Core Data Logic (Storage & Analysis). The local project seems to rely on a Python Backend + Supabase Storage, while the contract dictates a R2 + Direct DB pattern.

**Immediate Next Step**:
Resolve the Storage/Analysis architecture. Do we keep Supabase Storage (easier) or switch to R2 (Contract Compliance)?
