# AlphaStudio proxy shapes — observed, not guessed

Captured by `pnpm tsx scripts/smoke-alphastudio.ts` against the deployed API.
The `/alphastudio/*` namespace forwards the external service's response shape
unchanged and the contract says new fields may appear without notice, so
`src/api/types.ts` is transcribed from THIS file rather than from prose
(decisions.md D-INT-H). Re-run the script when the upstream changes.

- Run: `2026-08-17T12:01:39.618Z`
- Identity: `qa+1786968099618smoke@alphapromena.com` (fresh QA org, starter funding only)
- Media render included: yes (LIVE_MEDIA=1)

Session tokens and presigned urls are redacted; every other field is verbatim.

## What this run established

- CORS: PUT IS allowed; the proxy POST path IS allowed; x-request-id is still NOT an allowed request header (open-items 3).
- Org response carries `country`: null on a fresh org.
- Starter funding observed: {"cents":5000,"heldCents":0,"availableCents":5000}
- Granted capabilities: media.generate, social-posts.media, images.edit, photoshoot.generate, brand-assets.generate, logos.generate, logos.redesign, video-ads.generate, tones.preview, social-posts.generate
- Not granted / unknown: (none)
- Catalog model-row fields observed: alias, appMetadata, capabilities, capabilitySchema, cost, displayHint, kind, plan — price exposed: YES.
- tones-preview on a fresh org (no voice): 200 — no voice was needed.
- Run output fields: attributions, content, flags, index, judge, proposalId; content keys: content, rationale, toneId
- `slot` on posts/generate: status 400 without it — treat as REQUIRED.
- `embeddingModel` on rag/collections: api.md marks it OPTIONAL, the upstream answers 400 without it — treat as REQUIRED (send `embed-default`).
- Duplicate collection name → 400; the list then resolves it (found) — the lazy-create-then-reuse path holds.
- RAG extractable media types — accepted: application/pdf, text/plain, text/markdown, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- RAG media types refused: (none)
- RAG presigned PUT from Node: 200 — storage accepts it.
- Media presigned PUT from Node: 200.
- Render produced 1 asset(s).
- Wallet: 5000 → 4997 cents (available 5000 → 4997). Spend this pass: 3 cents.

## Captured exchanges, in order

### CORS preflight — PUT /orgs/:orgId/country

`OPTIONS /orgs/1/country` → **200**
> preflight for PUT; method allowed: YES

```
access-control-allow-origin: http://localhost:5173
access-control-allow-methods: *
access-control-allow-headers: content-type,authorization
access-control-max-age: 3600
```

### CORS preflight — POST /orgs/:orgId/alphastudio/posts/generate

`OPTIONS /orgs/1/alphastudio/posts/generate` → **200**
> preflight for POST; method allowed: YES

```
access-control-allow-origin: http://localhost:5173
access-control-allow-methods: *
access-control-allow-headers: content-type,authorization
access-control-max-age: 3600
```

### signup

`POST /auth/signup` → **201**

```json
{
  "email": "qa+1786968099618smoke@alphapromena.com",
  "codeExpiresAt": "2026-08-17T12:11:42.998Z"
}
```

### verify-email → auth session

`POST /auth/verify-email` → **200**
> token redacted below — the shape is what matters

```json
{
  "token": "<redacted token: 43 chars>",
  "expiresAt": "2026-08-18T00:01:43.990Z",
  "user": {
    "id": "859",
    "name": "QA Smoke",
    "email": "qa+1786968099618smoke@alphapromena.com",
    "role": "user",
    "status": "active",
    "emailVerifiedAt": "2026-08-17T12:01:43.615Z",
    "createdAt": "2026-08-17T12:01:42.513Z"
  },
  "orgs": []
}
```

### create org (funds the wallet)

`POST /orgs` → **201**

```json
{
  "org": {
    "id": "570",
    "name": "QA Smoke Org 1786968099618",
    "slug": "qa-smoke-org-1786968099618",
    "status": "active",
    "createdAt": "2026-08-17T12:01:44.578Z",
    "updatedAt": "2026-08-17T12:01:44.578Z",
    "country": null
  },
  "membership": {
    "id": "713",
    "orgId": "570",
    "userId": "859",
    "role": "owner",
    "isActive": true,
    "createdAt": "2026-08-17T12:01:44.578Z",
    "updatedAt": "2026-08-17T12:01:44.578Z"
  }
}
```

### wallet — fresh org

`GET /orgs/570/alphastudio/wallet` → **200**

```json
{
  "cents": 5000,
  "heldCents": 0,
  "availableCents": 5000
}
```

### catalog — media.generate

`GET /orgs/570/alphastudio/catalog/capabilities/media.generate` → **200**

```json
{
  "capability": "media.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Balanced image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.03"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Super image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.07"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced-audio",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video with audio (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-core",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.042"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-core-audio",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video with audio",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.052"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-super",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-super-audio",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video with audio (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.168"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — social-posts.media

`GET /orgs/570/alphastudio/catalog/capabilities/social-posts.media` → **200**

```json
{
  "capability": "social-posts.media",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Balanced image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.03"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Super image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.07"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced-audio",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video with audio (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-core",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.042"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-core-audio",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video with audio",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.052"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-super",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-super-audio",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video with audio (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.168"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — images.edit

`GET /orgs/570/alphastudio/catalog/capabilities/images.edit` → **200**

```json
{
  "capability": "images.edit",
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — photoshoot.generate

`GET /orgs/570/alphastudio/catalog/capabilities/photoshoot.generate` → **200**

```json
{
  "capability": "photoshoot.generate",
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — brand-assets.generate

`GET /orgs/570/alphastudio/catalog/capabilities/brand-assets.generate` → **200**

```json
{
  "capability": "brand-assets.generate",
  "selectable": false,
  "field": null,
  "plan": null,
  "models": [
    {
      "alias": "image-design",
      "kind": "image",
      "plan": null,
      "displayHint": "Design & lettered image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "brand-assets.generate"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — logos.generate

`GET /orgs/570/alphastudio/catalog/capabilities/logos.generate` → **200**

```json
{
  "capability": "logos.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-balanced",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Balanced image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.03"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-super",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Super image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top image",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — logos.redesign

`GET /orgs/570/alphastudio/catalog/capabilities/logos.redesign` → **200**

```json
{
  "capability": "logos.redesign",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "image-reference",
      "kind": "image",
      "plan": "creative",
      "displayHint": "Image from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "images.edit",
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "photoshoot.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.06"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-lite",
      "kind": "image",
      "plan": "balanced",
      "displayHint": "Edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.05"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "image-reference-top",
      "kind": "image",
      "plan": "precise",
      "displayHint": "Top edit from a reference",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "count": {
            "type": "integer",
            "maximum": 20,
            "minimum": 1
          },
          "aspectRatio": {
            "enum": [
              "1:1",
              "16:9",
              "9:16",
              "4:3",
              "3:4",
              "3:2",
              "2:3"
            ],
            "type": "string"
          },
          "outputFormat": {
            "enum": [
              "png",
              "jpeg",
              "webp"
            ],
            "type": "string"
          },
          "referenceImages": {
            "type": "array",
            "items": {
              "type": "string",
              "format": "uri"
            },
            "maxItems": 4,
            "minItems": 1
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "logos.generate",
        "logos.redesign",
        "media.generate",
        "social-posts.media"
      ],
      "cost": {
        "images": "0.211"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — video-ads.generate

`GET /orgs/570/alphastudio/catalog/capabilities/video-ads.generate` → **200**

```json
{
  "capability": "video-ads.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "video-image-balanced",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.07"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-balanced-audio",
      "kind": "video",
      "plan": "creative",
      "displayHint": "Image to video with audio (balanced)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-core",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.042"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-core-audio",
      "kind": "video",
      "plan": "balanced",
      "displayHint": "Image to video with audio",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.052"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "video-image-super",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.112"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "video-image-super-audio",
      "kind": "video",
      "plan": "precise",
      "displayHint": "Image to video with audio (super)",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "seed": {
            "type": "integer",
            "maximum": 4294967295,
            "minimum": 0
          },
          "imageUrl": {
            "type": "string",
            "format": "uri"
          },
          "durationS": {
            "anyOf": [
              {
                "type": "number",
                "const": 5
              },
              {
                "type": "number",
                "const": 10
              }
            ]
          },
          "generateAudio": {
            "type": "boolean"
          },
          "negativePrompt": {
            "type": "string",
            "maxLength": 1000
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "media.generate",
        "social-posts.media",
        "video-ads.generate"
      ],
      "cost": {
        "video_seconds": "0.168"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### catalog — tones.preview

`GET /orgs/570/alphastudio/catalog/capabilities/tones.preview` → **200**

```json
{
  "capability": "tones.preview",
  "selectable": false,
  "field": null,
  "plan": null,
  "models": []
}
```

### catalog — social-posts.generate

`GET /orgs/570/alphastudio/catalog/capabilities/social-posts.generate` → **200**

```json
{
  "capability": "social-posts.generate",
  "selectable": true,
  "field": "plan",
  "plan": null,
  "models": [
    {
      "alias": "balanced",
      "kind": "text",
      "plan": "balanced",
      "displayHint": "Balanced",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "topP": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "maxTokens": {
            "type": "integer",
            "maximum": 8192,
            "minimum": 1
          },
          "temperature": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "stopSequences": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "maxItems": 4
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "social-posts.generate"
      ],
      "cost": {
        "input_tokens": "0.0000008",
        "output_tokens": "0.0000032"
      },
      "appMetadata": {
        "min_plan": "free"
      }
    },
    {
      "alias": "creative",
      "kind": "text",
      "plan": "creative",
      "displayHint": "Creative",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "topP": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "maxTokens": {
            "type": "integer",
            "maximum": 8192,
            "minimum": 1
          },
          "temperature": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "stopSequences": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "maxItems": 4
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "social-posts.generate"
      ],
      "cost": {
        "input_tokens": "0.0000008",
        "output_tokens": "0.0000032"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    },
    {
      "alias": "precise",
      "kind": "text",
      "plan": "precise",
      "displayHint": "Precise",
      "capabilitySchema": {
        "type": "object",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "properties": {
          "topP": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "maxTokens": {
            "type": "integer",
            "maximum": 8192,
            "minimum": 1
          },
          "temperature": {
            "type": "number",
            "maximum": 1,
            "minimum": 0
          },
          "stopSequences": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "maxItems": 4
          }
        },
        "additionalProperties": false
      },
      "capabilities": [
        "social-posts.generate"
      ],
      "cost": {
        "input_tokens": "0.000003",
        "output_tokens": "0.000015"
      },
      "appMetadata": {
        "min_plan": "pro"
      }
    }
  ]
}
```

### posts/tones-preview — no brandVoice (bundle fallback)

`POST /orgs/570/alphastudio/posts/tones-preview` → **200**
> brandVoice deliberately omitted — the fallback path is what real generation uses

```json
{
  "runId": "run_ac0c88dd7d3b850842843468",
  "capability": "tones.preview",
  "capabilityVersion": 2,
  "mode": "sync",
  "status": "completed",
  "outputs": [
    {
      "index": 0,
      "content": {
        "sample": "Our Ethiopia Yirgacheffe arrived yesterday—bright acidity, notes of blueberry, roasted last Tuesday."
      },
      "flags": [],
      "attributions": []
    }
  ],
  "modelVersions": [
    {
      "step": "sample",
      "alias": "small"
    }
  ],
  "promptVersions": [
    {
      "capability": "tones.preview",
      "name": "v2",
      "version": 2,
      "contentHash": "d37f555ad7efe39b6349e013321f1e97e8eb1c2b9be39b9497ef4259447695ae"
    }
  ],
  "createdAt": "2026-08-17T12:01:57.930Z",
  "updatedAt": "2026-08-17T12:01:59.627Z"
}
```

### brand/voices — create the canonical row

`POST /orgs/570/brand/voices` → **201**
> D-INT-B: one canonical voice row named "Brand voice"

```json
{
  "id": "52",
  "orgId": "570",
  "description": "QA Smoke Org 1786968099618 brand voice",
  "createdAt": "2026-08-17T12:02:00.319Z",
  "updatedAt": "2026-08-17T12:02:00.319Z",
  "name": "Brand voice",
  "rules": [
    {
      "id": "31",
      "kind": "do",
      "text": "Sound like a person who roasts coffee, not a brand."
    }
  ]
}
```

### brand/voices — read back (rules embedded)

`GET /orgs/570/brand/voices` → **200**

```json
{
  "items": [
    {
      "id": "52",
      "orgId": "570",
      "description": "QA Smoke Org 1786968099618 brand voice",
      "createdAt": "2026-08-17T12:02:00.319Z",
      "updatedAt": "2026-08-17T12:02:00.319Z",
      "name": "Brand voice",
      "rules": [
        {
          "id": "31",
          "kind": "do",
          "text": "Sound like a person who roasts coffee, not a brand."
        }
      ]
    }
  ],
  "total": 1
}
```

### posts/generate — plan balanced, one tone, perTone 1

`POST /orgs/570/alphastudio/posts/generate` → **202**

```json
{
  "runId": "run_3b3a9d410b7239670489804d",
  "capability": "social-posts.generate",
  "capabilityVersion": 4,
  "mode": "batch",
  "status": "queued",
  "outputs": [],
  "modelVersions": [],
  "promptVersions": [],
  "createdAt": "2026-08-17T12:02:06.101Z",
  "updatedAt": "2026-08-17T12:02:06.101Z"
}
```

### posts/runs/:runId — terminal read (completed)

`GET /orgs/570/alphastudio/posts/runs/run_3b3a9d410b7239670489804d` → **200**
> THE draft output shape — what INT-10 renders from

```json
{
  "runId": "run_3b3a9d410b7239670489804d",
  "capability": "social-posts.generate",
  "capabilityVersion": 4,
  "mode": "batch",
  "status": "completed",
  "outputs": [
    {
      "index": 0,
      "content": {
        "toneId": "smoke-tone",
        "content": "Today's roast comes from the highlands of Ethiopia, freshly ground and ready for your morning cup. Enjoy the rich aroma and deep flavors. #CoffeeLovers #DailyRoast",
        "rationale": "The post was crafted to fit the 'Roastery floor' tone, focusing on the specific origin of the coffee and the experience of the roast, in line with the brand's voice of sounding like a person who roasts coffee. No exclamation marks or hype adjectives were used, adhering to the tone's rules. Since there were no specific `<history>` blocks to avoid, no particular post was sidestepped. No `<knowledge>` or `<source>` blocks were provided, so no refs are included in the rationale."
      },
      "judge": {
        "score": 0.65,
        "voice": 0.75,
        "grounding": 0.5,
        "repetition": 0
      },
      "flags": [],
      "attributions": [],
      "proposalId": "prop_ced73568e10f0ecd45d4836c"
    }
  ],
  "modelVersions": [
    {
      "step": "write",
      "alias": "balanced"
    },
    {
      "step": "score",
      "alias": "judge"
    }
  ],
  "promptVersions": [
    {
      "capability": "social-posts.generate",
      "name": "v7",
      "version": 7,
      "contentHash": "734fa9461349ad483988a86689350b7ac3737466500c212b43a0424030d0e6fd"
    },
    {
      "capability": "social-posts.generate",
      "name": "rubric-v6",
      "version": 6,
      "contentHash": "97637001b22eeae55f3995f483e73994500c5306af201fe68c63030677ac59f1"
    }
  ],
  "createdAt": "2026-08-17T12:02:06.101Z",
  "updatedAt": "2026-08-17T12:02:16.762Z"
}
```

### posts/generate — WITHOUT slot (is it required?)

`POST /orgs/570/alphastudio/posts/generate` → **400**
> a 400 here means F1 must always send a slot; a 202 means it is optional

```json
{
  "error": {
    "code": "bad_request",
    "message": "The generation service rejected the request — check the body against the capability's schema",
    "requestId": "aec648e1-df24-4243-a2fb-60d5ee327728"
  }
}
```

### posts/runs/:runId — unknown id

`GET /orgs/570/alphastudio/posts/runs/run_smoke_missing` → **404**
> the ledger must drop an id that answers 404 (D-INT-G)

```json
{
  "error": {
    "code": "not_found",
    "message": "Run not found",
    "requestId": "95a99694-1287-449f-b836-2d000e45d571"
  }
}
```

### rag/collections — WITHOUT embeddingModel (api.md says optional)

`POST /orgs/570/alphastudio/rag/collections` → **400**
> expected to fail — see the finding

```json
{
  "error": {
    "code": "bad_request",
    "message": "The knowledge service rejected the request — check the body (e.g. a name already used, or a media type it cannot extract)",
    "requestId": "5149daab-0710-4f0a-a2c5-120c54d85af2"
  }
}
```

### rag/collections — create "knowledge" (scope tenant)

`POST /orgs/570/alphastudio/rag/collections` → **201**

```json
{
  "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
  "name": "knowledge",
  "scope": "tenant",
  "embeddingModel": "embed-default",
  "chunkProfile": "default-text",
  "activeIndex": "aps-alphabeacon-embed-default-v1",
  "status": "active",
  "createdAt": "2026-08-17T12:02:21.616Z",
  "updatedAt": "2026-08-17T12:02:21.616Z"
}
```

### rag/collections — the SAME name again (duplicate)

`POST /orgs/570/alphastudio/rag/collections` → **400**
> I6 creates lazily: on this 400 it lists and reuses

```json
{
  "error": {
    "code": "bad_request",
    "message": "The knowledge service rejected the request — check the body (e.g. a name already used, or a media type it cannot extract)",
    "requestId": "adfc1623-f001-4ae5-b053-9fd6730abd87"
  }
}
```

### rag/collections — list (the reuse path)

`GET /orgs/570/alphastudio/rag/collections` → **200**

```json
{
  "collections": [
    {
      "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
      "name": "knowledge",
      "scope": "tenant",
      "embeddingModel": "embed-default",
      "chunkProfile": "default-text",
      "activeIndex": "aps-alphabeacon-embed-default-v1",
      "status": "active",
      "createdAt": "2026-08-17T12:02:21.616Z",
      "updatedAt": "2026-08-17T12:02:21.616Z"
    }
  ]
}
```

### rag sources — push markdown

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources` → **202**

```json
{
  "sourceId": "src_1a762b11388b45c38b5719e58b1b2c11",
  "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
  "kind": "push",
  "title": "Roasting notes",
  "mediaType": "text/markdown",
  "status": "Processing",
  "chunkCount": 0,
  "deduped": false,
  "createdAt": "2026-08-17T12:02:24.004Z",
  "updatedAt": "2026-08-17T12:02:24.004Z"
}
```

### rag/sources/:sourceId — terminal read (Ready)

`GET /orgs/570/alphastudio/rag/sources/src_1a762b11388b45c38b5719e58b1b2c11` → **200**

```json
{
  "sourceId": "src_1a762b11388b45c38b5719e58b1b2c11",
  "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
  "kind": "push",
  "title": "Roasting notes",
  "mediaType": "text/markdown",
  "status": "Ready",
  "contentHash": "b1fc347f0aacd4876da63ad23af20abd1d2c0a540d099ba5f5e659d109beaee8",
  "chunkCount": 1,
  "deduped": false,
  "createdAt": "2026-08-17T12:02:24.004Z",
  "updatedAt": "2026-08-17T12:02:28.065Z"
}
```

### rag sources/presign — application/pdf

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources/presign` → **201**

```json
{
  "sourceId": "src_f8f19cdb6f1142f7bdeef313b274c959",
  "uploadUrl": "<redacted uploadUrl: 1613 chars>",
  "expiresAt": "2026-08-17T12:17:31.524Z",
  "mediaType": "application/pdf"
}
```

### rag sources/presign — text/plain

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources/presign` → **201**

```json
{
  "sourceId": "src_383522d8896048c8b1c021b9a467ebf0",
  "uploadUrl": "<redacted uploadUrl: 1613 chars>",
  "expiresAt": "2026-08-17T12:17:33.846Z",
  "mediaType": "text/plain"
}
```

### rag sources/presign — text/markdown

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources/presign` → **201**

```json
{
  "sourceId": "src_db378f0a88ae4ed2b4ffa70c26a0fcf2",
  "uploadUrl": "<redacted uploadUrl: 1612 chars>",
  "expiresAt": "2026-08-17T12:17:36.118Z",
  "mediaType": "text/markdown"
}
```

### rag sources/presign — application/vnd.openxmlformats-officedocument.wordprocessingml.document

`POST /orgs/570/alphastudio/rag/collections/col_1cbb66d3815a4eb7b2d3740e62301d35/sources/presign` → **201**

```json
{
  "sourceId": "src_49410188af294db2a5b19c2b6e52cee8",
  "uploadUrl": "<redacted uploadUrl: 1614 chars>",
  "expiresAt": "2026-08-17T12:17:38.513Z",
  "mediaType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
```

### PUT bytes to the RAG presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200**
> proves the signature works; the BROWSER path additionally needs S3 CORS

### rag/sources/:sourceId — terminal read (Ready)

`GET /orgs/570/alphastudio/rag/sources/src_383522d8896048c8b1c021b9a467ebf0` → **200**

```json
{
  "sourceId": "src_383522d8896048c8b1c021b9a467ebf0",
  "collectionId": "col_1cbb66d3815a4eb7b2d3740e62301d35",
  "kind": "upload",
  "title": "smoke.txt",
  "mediaType": "text/plain",
  "status": "Ready",
  "contentHash": "1ec4b7136fb4dee3bf09e024fb9ae80d2c8fac3f164275fdbe0257baab7aa493",
  "chunkCount": 1,
  "deduped": false,
  "createdAt": "2026-08-17T12:02:33.828Z",
  "updatedAt": "2026-08-17T12:02:41.414Z"
}
```

### rag/sources/:id — DELETE (200 WITH a body)

`DELETE /orgs/570/alphastudio/rag/sources/src_1a762b11388b45c38b5719e58b1b2c11` → **200**

```json
{
  "sourceId": "src_1a762b11388b45c38b5719e58b1b2c11",
  "vectorsDeleted": 1
}
```

### rag/sources/:id — re-read after delete

`GET /orgs/570/alphastudio/rag/sources/src_1a762b11388b45c38b5719e58b1b2c11` → **404**
> expected 404

```json
{
  "error": {
    "code": "not_found",
    "message": "Source not found",
    "requestId": "31fc08f1-a524-4064-90c3-d9b524813b66"
  }
}
```

### media/assets/presign — image/png

`POST /orgs/570/alphastudio/media/assets/presign` → **201**

```json
{
  "assetId": "masset_4b73c1a2d8f58aadd95e5a96",
  "uploadUrl": "<redacted uploadUrl: 1604 chars>",
  "expiresAt": "2026-08-17T12:17:48.073Z",
  "mediaType": "image/png"
}
```

### PUT a 1×1 PNG to the media presigned url (from Node)

`PUT (presigned storage url — not our API)` → **200**
> the reference-image door; the browser path additionally needs S3 CORS

### media/assets/:id/presign — download url

`POST /orgs/570/alphastudio/media/assets/masset_4b73c1a2d8f58aadd95e5a96/presign` → **200**

```json
{
  "assetId": "masset_4b73c1a2d8f58aadd95e5a96",
  "url": "<redacted url: 1564 chars>",
  "expiresAt": "2026-08-17T13:02:50.087Z"
}
```

### media/assets/:id — DELETE

`DELETE /orgs/570/alphastudio/media/assets/masset_4b73c1a2d8f58aadd95e5a96` → **204**
> expected 204

### media/jobs — list (empty or prior jobs, no presigned urls)

`GET /orgs/570/alphastudio/media/jobs` → **200**

```json
{
  "jobs": []
}
```

### media/jobs — media.generate, balanced, 1:1 png

`POST /orgs/570/alphastudio/media/jobs` → **202**
> never send modelAlias — it is refused by name

```json
{
  "jobId": "mjob_2cb5975ccd174177c3ab1d3b",
  "status": "queued",
  "capability": "media.generate",
  "plan": "balanced",
  "modelAlias": "image-balanced",
  "origin": {
    "kind": "standalone"
  },
  "assets": [],
  "createdAt": "2026-08-17T12:02:52.760Z",
  "updatedAt": "2026-08-17T12:02:52.760Z"
}
```

### media/jobs/:jobId — terminal read (succeeded)

`GET /orgs/570/alphastudio/media/jobs/mjob_2cb5975ccd174177c3ab1d3b` → **200**
> the render shape, assets with 1-hour presigned urls

```json
{
  "jobId": "mjob_2cb5975ccd174177c3ab1d3b",
  "status": "succeeded",
  "capability": "media.generate",
  "plan": "balanced",
  "modelAlias": "image-balanced",
  "origin": {
    "kind": "standalone"
  },
  "assets": [
    {
      "assetId": "masset_50db5663d865634ed52042be",
      "kind": "image",
      "url": "<redacted url: 1556 chars>",
      "expiresAt": "2026-08-17T13:03:12.591Z",
      "meta": {
        "width": 1024,
        "height": 1024,
        "synthetic": true
      }
    }
  ],
  "createdAt": "2026-08-17T12:02:52.760Z",
  "updatedAt": "2026-08-17T12:03:09.647Z"
}
```

### media/assets/:id — DELETE a render output

`DELETE /orgs/570/alphastudio/media/assets/masset_50db5663d865634ed52042be` → **204**

### usage — group_by=capability

`GET /orgs/570/alphastudio/usage?from=2026-07-19&to=2026-08-17&group_by=capability` → **200**

```json
{
  "from": "2026-07-19",
  "to": "2026-08-17",
  "groupBy": "capability",
  "groups": [
    {
      "key": "media.generate",
      "unit": "guardrail_text_units",
      "qty": 1,
      "costUsdEstimate": "0.000150000000"
    },
    {
      "key": "media.generate",
      "unit": "images",
      "qty": 1,
      "costUsdEstimate": "0.030000000000"
    },
    {
      "key": "media.generate",
      "unit": "tokens",
      "qty": 27,
      "costUsdEstimate": "0.000003240000"
    },
    {
      "key": "social-posts.generate",
      "unit": "guardrail_text_units",
      "qty": 2,
      "costUsdEstimate": "0.000300000000"
    },
    {
      "key": "social-posts.generate",
      "unit": "input_tokens",
      "qty": 4241,
      "costUsdEstimate": "0.003803600000"
    },
    {
      "key": "social-posts.generate",
      "unit": "output_tokens",
      "qty": 622,
      "costUsdEstimate": "0.002827400000"
    },
    {
      "key": "tones.preview",
      "unit": "input_tokens",
      "qty": 677,
      "costUsdEstimate": "0.000677000000"
    },
    {
      "key": "tones.preview",
      "unit": "output_tokens",
      "qty": 29,
      "costUsdEstimate": "0.000145000000"
    }
  ],
  "days": [
    {
      "day": "2026-08-17",
      "unit": "guardrail_text_units",
      "qty": 3,
      "costUsdEstimate": "0.000450000000"
    },
    {
      "day": "2026-08-17",
      "unit": "images",
      "qty": 1,
      "costUsdEstimate": "0.030000000000"
    },
    {
      "day": "2026-08-17",
      "unit": "input_tokens",
      "qty": 4918,
      "costUsdEstimate": "0.004480600000"
    },
    {
      "day": "2026-08-17",
      "unit": "output_tokens",
      "qty": 651,
      "costUsdEstimate": "0.002972400000"
    },
    {
      "day": "2026-08-17",
      "unit": "tokens",
      "qty": 27,
      "costUsdEstimate": "0.000003240000"
    }
  ]
}
```

### usage — group_by=model

`GET /orgs/570/alphastudio/usage?from=2026-07-19&to=2026-08-17&group_by=model` → **200**

```json
{
  "from": "2026-07-19",
  "to": "2026-08-17",
  "groupBy": "model",
  "groups": [
    {
      "key": null,
      "unit": "guardrail_text_units",
      "qty": 3,
      "costUsdEstimate": "0.000450000000"
    },
    {
      "key": "balanced",
      "unit": "input_tokens",
      "qty": 2187,
      "costUsdEstimate": "0.001749600000"
    },
    {
      "key": "balanced",
      "unit": "output_tokens",
      "qty": 157,
      "costUsdEstimate": "0.000502400000"
    },
    {
      "key": "embed-default",
      "unit": "tokens",
      "qty": 27,
      "costUsdEstimate": "0.000003240000"
    },
    {
      "key": "image-balanced",
      "unit": "images",
      "qty": 1,
      "costUsdEstimate": "0.030000000000"
    },
    {
      "key": "judge",
      "unit": "input_tokens",
      "qty": 2054,
      "costUsdEstimate": "0.002054000000"
    },
    {
      "key": "judge",
      "unit": "output_tokens",
      "qty": 465,
      "costUsdEstimate": "0.002325000000"
    },
    {
      "key": "small",
      "unit": "input_tokens",
      "qty": 677,
      "costUsdEstimate": "0.000677000000"
    },
    {
      "key": "small",
      "unit": "output_tokens",
      "qty": 29,
      "costUsdEstimate": "0.000145000000"
    }
  ],
  "days": [
    {
      "day": "2026-08-17",
      "unit": "guardrail_text_units",
      "qty": 3,
      "costUsdEstimate": "0.000450000000"
    },
    {
      "day": "2026-08-17",
      "unit": "images",
      "qty": 1,
      "costUsdEstimate": "0.030000000000"
    },
    {
      "day": "2026-08-17",
      "unit": "input_tokens",
      "qty": 4918,
      "costUsdEstimate": "0.004480600000"
    },
    {
      "day": "2026-08-17",
      "unit": "output_tokens",
      "qty": 651,
      "costUsdEstimate": "0.002972400000"
    },
    {
      "day": "2026-08-17",
      "unit": "tokens",
      "qty": 27,
      "costUsdEstimate": "0.000003240000"
    }
  ]
}
```

### usage — malformed window (expect 400)

`GET /orgs/570/alphastudio/usage?from=yesterday&to=2026-08-17&group_by=model` → **400**
> local validation, never reaches the upstream

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "details": [
      {
        "field": "from",
        "message": "Invalid ISO date"
      }
    ],
    "requestId": "5b734bec-d43a-4cd0-9009-f11b01483289"
  }
}
```

### wallet — after the run

`GET /orgs/570/alphastudio/wallet` → **200**

```json
{
  "cents": 4997,
  "heldCents": 0,
  "availableCents": 4997
}
```

### PUT /orgs/:id/country — JO (slow: loads the calendar)

`PUT /orgs/570/country` → **200**
> expect ~10 s

```json
{
  "org": {
    "id": "570",
    "name": "QA Smoke Org 1786968099618",
    "slug": "qa-smoke-org-1786968099618",
    "status": "active",
    "createdAt": "2026-08-17T12:01:44.578Z",
    "updatedAt": "2026-08-17T12:03:29.595Z",
    "country": "JO"
  },
  "holidaysCount": 2,
  "reloaded": true
}
```

### PUT /orgs/:id/country — same country again

`PUT /orgs/570/country` → **200**
> expect reloaded:false, a cheap no-op

```json
{
  "org": {
    "id": "570",
    "name": "QA Smoke Org 1786968099618",
    "slug": "qa-smoke-org-1786968099618",
    "status": "active",
    "createdAt": "2026-08-17T12:01:44.578Z",
    "updatedAt": "2026-08-17T12:03:29.595Z",
    "country": "JO"
  },
  "holidaysCount": 2,
  "reloaded": false
}
```

### GET /orgs/:id/holidays — calendar order

`GET /orgs/570/holidays?limit=3` → **200**

```json
{
  "items": [
    {
      "id": "12",
      "orgId": "570",
      "date": "2026-08-25",
      "event": "Prophet Muhammad's Birthday (Mawlid al-Nabi)",
      "rules": [
        {
          "kind": "do",
          "text": "Acknowledge the occasion with a respectful, warm message that honours the Prophet's legacy and its meaning for Muslim communities."
        },
        {
          "kind": "do",
          "text": "Use Arabic alongside English if your audience is primarily Jordanian — 'المولد النبوي' is the widely recognised term."
        },
        {
          "kind": "do",
          "text": "Keep the tone reverent and sincere; brief, heartfelt messages tend to land better than lengthy copy on this day."
        },
        {
          "kind": "dont",
          "text": "Do not use the occasion as a promotional hook or attach discount offers — commercial framing around a religious observance reads as disrespectful."
        },
        {
          "kind": "dont",
          "text": "Do not publish imagery of the Prophet or any figurative religious art; this is considered deeply offensive in Islamic tradition."
        },
        {
          "kind": "dont",
          "text": "Do not treat the date as a generic 'holiday' — it is a specifically Islamic religious commemoration and should be addressed as such."
        }
      ],
      "createdAt": "2026-08-17T12:03:29.595Z"
    },
    {
      "id": "13",
      "orgId": "570",
      "date": "2026-12-25",
      "event": "Christmas Day",
      "rules": [
        {
          "kind": "do",
          "text": "Acknowledge Christmas as a public holiday celebrated by Jordan's Christian community, while being mindful that the majority of your audience is Muslim."
        },
        {
          "kind": "do",
          "text": "Frame messaging inclusively — wishing Christian followers a joyful celebration is appropriate without making it a universal national moment."
        },
        {
          "kind": "do",
          "text": "Note that Orthodox Christians in Jordan may also celebrate Christmas on 7 January; consider a separate acknowledgement if your audience includes them."
        },
        {
          "kind": "dont",
          "text": "Do not assume the entire Jordanian audience celebrates Christmas — avoid blanket 'everyone is celebrating' framing."
        },
        {
          "kind": "dont",
          "text": "Do not lean into heavily commercialised Western Christmas imagery (Santa, gift-haul themes) without considering whether it fits your brand's local tone."
        }
      ],
      "createdAt": "2026-08-17T12:03:29.595Z"
    }
  ],
  "total": 2
}
```

## Proposals & published-social — NOT PROXIED (probed 2026-08-18)

Probed because every draft a run produces comes back carrying a `proposalId`
(`prop_…`), so the proposals ledger demonstrably exists upstream — the question
was only whether our API exposes it. It does not, yet.

### 1. The live contract is unchanged

`GET {base}/openapi` was fetched and diffed against the committed
`Docs/api/openapi.json`:

```
live      version 0.1.0 · 62 paths
committed version 0.1.0 · 62 paths
added:   0
removed: 0
paths matching /proposal|published/: (none)
```

So the contract in this repo is current. Nothing has been added since the
2026-08-17 drop.

### 2. A route-level probe agrees, and here is how to read it

**The trap: an UNAUTHENTICATED probe proves nothing.** Auth runs before
routing, so every path — including deliberate nonsense like
`/orgs/1/alphastudio/posts/runs` — answers `401 unauthorized`. A first pass
that reads those 401s as "the route exists, it just needs a token" would
conclude the opposite of the truth. The probe must carry a real session and a
real org id, and it needs a known-good control and a known-bad control to be
worth anything.

Authenticated, on an org the caller owns:

| Status | code | Method | Path |
| ------ | ---- | ------ | ---- |
| **200** | — | GET | `/orgs/:id/alphastudio/wallet` — **control: exists** |
| **404** | `not_found` | GET | `/orgs/:id/alphastudio/nonexistent-xyz` — **control: does not** |
| 404 | `not_found` | GET | `/orgs/:id/alphastudio/proposals` |
| 404 | `not_found` | GET | `/orgs/:id/alphastudio/proposals?state=pending&limit=10` |
| 404 | `not_found` | POST | `/orgs/:id/alphastudio/proposals/:id/approve` |
| 404 | `not_found` | POST | `/orgs/:id/alphastudio/proposals/:id/decline` |
| 404 | `not_found` | GET | `/orgs/:id/alphastudio/published-social` |
| 404 | `not_found` | POST | `/orgs/:id/alphastudio/published-social` |
| 404 | `not_found` | POST | `/orgs/:id/alphastudio/published-social/delete` |
| 404 | `not_found` | GET | `/orgs/:id/alphastudio/posts/proposals` |
| 404 | `not_found` | GET | `/orgs/:id/proposals` (outside the proxy namespace) |

Every candidate answers exactly what a route that does not exist answers, and
nothing answers what a route that does exist answers.

### 3. What that means for the frontend

No generation run was made for this probe: with no list endpoint to call, a run
would have spent the org's funding to learn nothing. The relevant shape is
already captured above — `outputs[].proposalId`, e.g.
`prop_bf6fd4c695b9c20418ac5050`.

- INT-10's position stands: F1's drafts are read-only, and approve / decline /
  schedule remain ABSENT rather than disabled (decisions.md D-INT-G).
- The `proposalId` keeps being stored in the local run ledger and never
  rendered. It is the handle the day the surface is proxied, and storing it now
  costs nothing.
- open-items 21(b) stays OPEN, now with evidence rather than an assumption.

Re-run with `pnpm smoke:alphastudio` once the backend says the surface is up;
the diff in §1 is the cheap check that tells you whether it is worth probing.
