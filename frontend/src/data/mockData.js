export const initialSummaryMetrics = [
  {
    id: 'active',
    label: 'Active Incidents',
    value: '4',
    subtext: '+1 from last hour',
    changeType: 'negative', // in incident management, more active is negative
    icon: 'AlertTriangle',
    color: '#ef4444',
  },
  {
    id: 'resolved_today',
    label: 'Resolved Today',
    value: '18',
    subtext: '94.4% within SLA',
    changeType: 'positive',
    icon: 'CheckCircle2',
    color: '#10b981',
  },
  {
    id: 'avg_time',
    label: 'Avg Resolution Time',
    value: '14m 20s',
    subtext: '-3.2m vs 30d baseline',
    changeType: 'positive',
    icon: 'Clock',
    color: '#6366f1',
  },
  {
    id: 'memory_matches',
    label: 'Memory Matches',
    value: '92%',
    subtext: '12 past incident runbooks retrieved',
    changeType: 'neutral',
    icon: 'Brain',
    color: '#a855f7',
  },
];

export const initialActiveIncidents = [
  {
    id: 'INC-204',
    title: 'API Server 500 Errors',
    severity: 'P1',
    severityLabel: 'Critical',
    status: 'Investigating',
    time: '14m ago',
    service: 'api-gateway-us-east',
    lead: 'Sarah K. (On-Call SRE)',
    impact: 'Elevated 500 response rates across primary ingress routers (8.4% error rate).',
    similarityMatch: null,
  },
  {
    id: 'INC-203',
    title: 'Database Connection Timeout',
    severity: 'P1',
    severityLabel: 'Critical',
    status: 'Identified',
    time: '28m ago',
    service: 'aurora-postgres-primary',
    lead: 'Marcus R. (Database Lead)',
    impact: 'Connection pool saturated at 100/100 active connections. Read query latency > 4,200ms.',
    similarityMatch: {
      pastIncidentId: '#184',
      similarityPercentage: '92%',
      previousResolution: 'Increased database connection pool from 50 to 100.',
    },
  },
  {
    id: 'INC-202',
    title: 'Payment Service Failure',
    severity: 'P2',
    severityLabel: 'High',
    status: 'Mitigating',
    time: '46m ago',
    service: 'checkout-payment-svc',
    lead: 'Elena V. (Payments Lead)',
    impact: 'Stripe webhook retry storm tripping circuit breaker on batch settlement workers.',
    similarityMatch: {
      pastIncidentId: '#165',
      similarityPercentage: '78%',
      previousResolution: 'Scaled async consumer concurrency and enabled rate limiting token bucket.',
    },
  },
  {
    id: 'INC-201',
    title: 'Authentication Service Latency',
    severity: 'P3',
    severityLabel: 'Medium',
    status: 'Monitoring',
    time: '1h 12m ago',
    service: 'auth0-session-broker',
    lead: 'Devin T. (Security Core)',
    impact: 'p99 JWT validation duration jumped to 850ms following deployment v2.14.1.',
    similarityMatch: {
      pastIncidentId: '#142',
      similarityPercentage: '85%',
      previousResolution: 'Reverted bad Redis token caching policy and cleared stale auth keys.',
    },
  },
];

export const initialRecentIncidents = [
  {
    id: 'INC-198',
    title: 'Redis Cache Eviction Storm',
    severity: 'P2',
    service: 'cache-redis-cluster',
    duration: '34m',
    resolvedAt: 'Today 04:12 UTC',
    status: 'Resolved',
    responder: 'Alex Chen',
    resolutionSummary: 'Applied volatile-lru policy and resized memory threshold from 16GB to 32GB.',
  },
  {
    id: 'INC-195',
    title: 'Ingress TLS Handshake Latency Spike',
    severity: 'P3',
    service: 'k8s-ingress-traefik',
    duration: '18m',
    resolvedAt: 'Yesterday 18:40 UTC',
    status: 'Resolved',
    responder: 'Elena Rostova',
    resolutionSummary: 'Updated OCSP stapling cache interval and renewed upstream intermediate certificates.',
  },
  {
    id: 'INC-192',
    title: 'Worker Queue Backlog (Kafka Partition 4)',
    severity: 'P2',
    service: 'async-worker-pool',
    duration: '52m',
    resolvedAt: 'Yesterday 11:22 UTC',
    status: 'Resolved',
    responder: 'Marcus Ray',
    resolutionSummary: 'Rebalanced consumer group offsets and scaled replica pod count from 6 to 14.',
  },
  {
    id: 'INC-188',
    title: 'Elasticsearch Yellow Cluster State',
    severity: 'P3',
    service: 'observability-es-prod',
    duration: '1h 05m',
    resolvedAt: 'Sep 26 14:10 UTC',
    status: 'Resolved',
    responder: 'Devin Thorne',
    resolutionSummary: 'Purged unassigned shard replicas on deprecated cold tier nodes.',
  },
  {
    id: 'INC-184',
    title: 'DB Connection Pool Saturation Post-Release',
    severity: 'P1',
    service: 'aurora-postgres-primary',
    duration: '22m',
    resolvedAt: 'Sep 24 09:30 UTC',
    status: 'Resolved',
    responder: 'Sarah Kim',
    resolutionSummary: 'Increased database connection pool from 50 to 100; patched unclosed connection leak.',
  },
];

export const aiInsightSample = {
  title: 'AI Incident Intelligence',
  badge: 'Live Correlated Insight',
  incidentTarget: 'INC-203 (Database Connection Timeout)',
  highlight: 'Similar incident detected',
  similarityScore: '92%',
  matchedIncidentId: 'Incident #184',
  previousResolution: 'Increased database connection pool from 50 to 100.',
  analysis:
    'Sustained concurrent connection requests from auth0-session-broker and checkout-payment-svc have exceeded the configured pool limit of 100. Symptoms, logs, and query profiles correlate 92% with INC-184.',
  rootCauseHypothesis:
    'Unclosed cursor handles during failed payment retry storms leading to connection starvation.',
  recommendedActions: [
    {
      id: 1,
      title: 'Scale Connection Pool Ceiling',
      detail: 'Increase pool size to 150 temporarily via RDS Parameter Group.',
      type: 'primary',
    },
    {
      id: 2,
      title: 'Run Active Idle Connection Reaper',
      detail: 'Kill connections idle in transaction for > 30 seconds.',
      type: 'secondary',
    },
    {
      id: 3,
      title: 'Inspect Diff Against INC-184 Resolution',
      detail: 'Review git commit 8f29d1c from Sep 24.',
      type: 'tertiary',
    },
  ],
};

export const memoryCategories = [
  {
    id: 'previous_incidents',
    name: 'Previous Incidents',
    description: 'Indexed post-mortems and incident timelines from past outages',
    count: 38,
    items: [
      {
        id: 'MEM-01',
        title: 'Incident #184: Aurora Postgres Pool Exhaustion',
        tags: ['Database', 'Postgres', 'P1'],
        date: 'Sep 24, 2026',
        details:
          'Occurred during morning traffic spike. Saturated 50-conn pool within 4 minutes. Required manual parameter group bump to 100.',
      },
      {
        id: 'MEM-02',
        title: 'Incident #172: SSE Connection Memory Leak',
        tags: ['Node.js', 'Ingress', 'P2'],
        date: 'Sep 12, 2026',
        details:
          'Long-lived Server-Sent Events omitted unbind on client disconnect. Node heap grew 250MB/hour until OOM killed.',
      },
      {
        id: 'MEM-03',
        title: 'Incident #159: Cloudflare BGP Route Flapping',
        tags: ['Networking', 'DNS', 'P2'],
        date: 'Aug 29, 2026',
        details:
          'Intermittent DNS resolution failures for US-West customers caused by transit ISP route advertisement degradation.',
      },
    ],
  },
  {
    id: 'root_causes',
    name: 'Root Causes',
    description: 'Underlying architectural flaws and configuration drifts identified',
    count: 24,
    items: [
      {
        id: 'MEM-04',
        title: 'HikariCP max-pool vs Kubernetes Pod Replica Mismatch',
        tags: ['Configuration', 'Kubernetes'],
        date: 'Aug 14, 2026',
        details:
          'When horizontal pod autoscaler scales pods from 5 to 12, total database connections exceed RDS instance max_connections.',
      },
      {
        id: 'MEM-05',
        title: 'Missing Compound Index on Audit Logs Table',
        tags: ['Database', 'Query Optimization'],
        date: 'Jul 22, 2026',
        details:
          'Full table scan triggered on `audit_events` when querying tenant_id + timestamp, generating I/O bottleneck.',
      },
      {
        id: 'MEM-06',
        title: 'Missing gRPC Deadline Propagation on Downstream Calls',
        tags: ['Microservices', 'Timeout'],
        date: 'Jun 19, 2026',
        details:
          'Calling services continued blocking on exhausted threads when downstream payment gateway stalled.',
      },
    ],
  },
  {
    id: 'successful_resolutions',
    name: 'Successful Resolutions',
    description: 'Verified operational fixes and playbook steps that succeeded',
    count: 42,
    items: [
      {
        id: 'MEM-07',
        title: 'RDS Proxy Connection Multiplexing Enablement',
        tags: ['Resolution', 'Verified'],
        date: 'Sep 24, 2026',
        details:
          'Enabled AWS RDS Proxy with transaction pinning disabled. Reduced database connection count by 78% while doubling throughput.',
      },
      {
        id: 'MEM-08',
        title: 'Zero-Downtime Rollback of Canary v3.1.2',
        tags: ['Deployment', 'Rollback'],
        date: 'Sep 18, 2026',
        details:
          'Argo Rollouts automated rollback triggered after error rate surpassed 1.5% threshold. Recovery completed in 90 seconds.',
      },
      {
        id: 'MEM-09',
        title: 'Dynamic Rate Limiter Token Bucket via Redis',
        tags: ['Traffic Control', 'Security'],
        date: 'Sep 02, 2026',
        details:
          'Shielded checkout endpoints from bot retry floods by throttling requests exceeding 120 req/min per IP hash.',
      },
    ],
  },
  {
    id: 'failed_resolutions',
    name: 'Failed Resolutions (What NOT to do)',
    description: 'Unsuccessful mitigation attempts and hazardous operations documented to prevent recurrence',
    count: 14,
    items: [
      {
        id: 'MEM-10',
        title: '❌ Simultaneous Restart of All Database Cluster Replicas',
        tags: ['Anti-Pattern', 'Hazard'],
        date: 'Jul 04, 2026',
        details:
          'Restarting read replicas in parallel triggered replication lag panic and overwhelmed the primary master for 18 minutes.',
      },
      {
        id: 'MEM-11',
        title: '❌ Blindly Flushing Production Redis Keys (FLUSHALL)',
        tags: ['Anti-Pattern', 'Cache Stampede'],
        date: 'May 11, 2026',
        details:
          'Flushing cache without warm-up scripts caused a severe cache stampede / thundering herd that crashed upstream API servers.',
      },
      {
        id: 'MEM-12',
        title: '❌ Increasing HTTP Timeout from 5s to 60s Under Load',
        tags: ['Anti-Pattern', 'Cascading Failure'],
        date: 'Apr 28, 2026',
        details:
          'Instead of fixing downstream latency, lengthened timeouts caused all available worker threads to backlog and crash.',
      },
    ],
  },
  {
    id: 'deployment_problems',
    name: 'Deployment-Related Problems',
    description: 'Post-deploy bugs, schema lockouts, and environment variable drift',
    count: 19,
    items: [
      {
        id: 'MEM-13',
        title: 'Postgres DDL Exclusive Table Lock in Alembic Migration',
        tags: ['Deploy', 'Alembic', 'Postgres'],
        date: 'Aug 03, 2026',
        details:
          'Adding a column with a non-constant DEFAULT value on table with 14M rows held an exclusive lock and timed out active writes.',
      },
      {
        id: 'MEM-14',
        title: 'Staging vs Production JWT Algorithm Config Drift (HS256 vs RS256)',
        tags: ['Deploy', 'Auth', 'Secret'],
        date: 'Jul 15, 2026',
        details:
          'Release v2.14.0 deployed with asymmetric key validation enabled in code while production vault was supplying HMAC secret.',
      },
    ],
  },
];
