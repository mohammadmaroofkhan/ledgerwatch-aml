# CLAUDE.md - AML Transaction Monitoring & SMR Reporting System

Guidelines and architecture patterns for developing the AI-powered Anti-Money Laundering (AML) Transaction Monitoring and Suspicious Matter Report (SMR) platform using Claude and the Model Context Protocol (MCP).

---

## 1. Project Overview & Architecture

An agentic AML compliance web application that monitors high-velocity transaction streams, surfaces financial crime typologies, enriches alerts with OSINT/sanctions intelligence, and drafts regulator-ready Suspicious Matter Reports (SMR).

```
                        ┌────────────────────────────────────────────────────────┐
                        │                   Next.js Frontend                     │
                        │   (Alerts Queue, Graph Visualizer, SMR Filing Studio)  │
                        └───────────────────────────┬────────────────────────────┘
                                                    │ REST / SSE
                        ┌───────────────────────────▼────────────────────────────┐
                        │             Backend Orchestration (Node / Python)      │
                        │       Rule-Based Ingestion ──► Agent Dispatcher        │
                        └─────────┬───────────────────┬───────────────────┬──────┘
                                  │                   │                   │
                     ┌────────────▼──────┐   ┌────────▼────────┐   ┌──────▼───────────┐
                     │ Investigation     │   │ Adverse Media   │   │ SMR Drafter      │
                     │ Agent (Sonnet)    │   │ Agent (Haiku)   │   │ Agent (Sonnet)   │
                     └────────────┬──────┘   └────────┬────────┘   └──────┬───────────┘
                                  │                   │                   │
┌─────────────────────────────────┴───────────────────┴───────────────────┴──────────┐
│                             Model Context Protocol (MCP) Tools                     │
├────────────────────┬────────────────────┬────────────────────┬─────────────────────┤
│   PostgreSQL MCP   │     Neo4j MCP      │     Yente MCP      │   Brave Search MCP  │
│ (Transactions/KYC) │  (Graph Topology)  │ (Sanctions / PEP)  │   (Adverse Media)   │
└────────────────────┴────────────────────┴────────────────────┴─────────────────────┘
```

### Core Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI, Cytoscape.js (transaction network graphs).
- **Backend & API**: Python 3.11+ (FastAPI) or Node.js 22 (TypeScript), Anthropic SDK (`@anthropic-ai/sdk`).
- **Data Stores**:
  - PostgreSQL: Transaction ledgers, KYC profiles, rule alert tables.
  - Neo4j: Multi-hop transaction paths, entity resolution, money mule networks.
- **Screening**: OpenSanctions `yente` container (local REST API for PEP, AUSTRAC, OFAC, UN lists).
- **LLMs**:
  - `claude-3-5-sonnet`: Deep transaction investigation, Cypher graph query generation, SMR narrative drafting.
  - `claude-3-5-haiku`: High-throughput alert triage, adverse media entity extraction, classification.

---

## 2. Model Context Protocol (MCP) Configuration

Configure your Claude agent MCP servers in `mcp_config.json`:

```json
{
  "mcpServers": {
    "aml-postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://aml_user:aml_pass@localhost:5432/aml_monitoring"]
    },
    "aml-neo4j": {
      "command": "uvx",
      "args": ["mcp-neo4j-cypher", "--uri", "bolt://localhost:7687", "--user", "neo4j", "--password", "password"]
    },
    "opensanctions-screening": {
      "command": "python",
      "args": ["mcp_servers/yente_screening_mcp.py"]
    },
    "adverse-media-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

---

## 3. Data Ingestion & Open-Source Datasets

Seed the environment using free, open-source benchmarks:
1. **IBM AML-Data (GitHub)**: Ingest CSVs into PostgreSQL via `scripts/seed_ibm_aml.py`.
2. **OpenSanctions / Yente**: Run the container for sanctions matching:
   ```bash
   docker run -d -p 8000:8000 --name yente opensanctions/yente
   ```
3. **Neo4j Graph Construction**: Project `source_account -> [TRANSFERRED {amount, timestamp}] -> target_account` relationships to uncover layering rings.

---

## 4. Key AML Typologies to Implement

Every transaction monitoring rule and agent workflow must check for:
- **Structuring (Smurfing)**: Multiple transactions aggregated just below cash reporting ceilings (e.g., $8,500 – $9,950 within 48 hours).
- **Pass-Through / Mule Velocity**: Account receives multiple incoming transfers and dissipates >95% of funds within 1 to 4 hours.
- **Circular Flow (Round-Tripping)**: Funds originate from Account A, route through shell accounts B and C, and return to A or an affiliate.
- **Fan-Out / Scattering**: Single large deposit disbursed into multiple small transfers to unrelated individuals across jurisdictions.
- **Rapid Escalation / Dormant Revival**: Accounts with zero activity for 180+ days suddenly initiating high-value wires.

---

## 5. Regulatory SMR Narrative Structure

All generated SMRs must strictly answer the regulatory **5 Ws + H**:

1. **Who**: Target customer details, beneficial owners (UBO), verified identity, counterparty details.
2. **What**: Instrument used (wire, cash deposit, crypto swap), amounts, transaction frequencies, and currencies.
3. **When**: Exact dates, timestamps, velocity window, and historical baseline period.
4. **Where**: Originating institution, IP geolocations, recipient banks, and trans-border jurisdictions.
5. **Why**: The explicit basis for suspicion, linking observed activity to designated financial crime typologies.
6. **How**: Step-by-step funds routing mechanism, shell company involvement, or structuring behavior.

> **Regulatory Compliance Guardrail**: AI agents draft the SMR narrative and cite underlying ledger records; human compliance officers retain final sign-off authority prior to submission.

---

## 6. Development Commands

### Environment Setup
```bash
# Clone the repository
git clone <repo-url> aml-monitoring-platform
cd aml-monitoring-platform

# Start local infrastructure (Postgres, Neo4j, Yente)
docker compose up -d

# Python backend setup
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Data Seeding
```bash
# Download sample transaction data and seed database
python scripts/seed_database.py --source ibm-aml --records 50000
python scripts/build_graph.py
```

### Running Services
```bash
# Start backend API & MCP agent runner
cd backend && uvicorn app.main:app --reload --port 8080

# Start Next.js frontend
cd frontend && npm run dev
```

### Testing
```bash
# Run backend tests & typology rule evaluations
pytest tests/ -v

# Run frontend unit & E2E tests
npm run test
```

---

## 7. Code Conventions & Engineering Guidelines

- **TypeScript / Python**: Enforce strict typing. Use Pydantic models for backend API schemas and Zod for frontend validation.
- **Audit Logging**: Store full JSON traces of Claude's reasoning chain, tool parameters, raw SQL/Cypher queries, and execution timestamps for regulatory audit trails.
- **Explainability**: SMR drafts must include inline Markdown citations referencing the specific transaction ID, counterparty, and timestamp behind each claim.
- **Security & Privacy**: Never leak customer PII into public log streams. Obfuscate tax identifiers and account numbers in application logs.
