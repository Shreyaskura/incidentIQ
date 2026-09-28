const API_BASE_URL =
  import.meta.env.VITE_API_URL || '';

/**
 * Check backend health status
 */
export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) {
      const fallbackRes = await fetch(`${API_BASE_URL}/health`);
      if (!fallbackRes.ok) {
        throw new Error(`Health check failed with status ${res.status}`);
      }
      return await fallbackRes.json();
    }
    return await res.json();
  } catch (err) {
    console.error('API Error [fetchHealth]:', err);
    throw err;
  }
}

/**
 * Fetch all incidents from backend
 */
export async function fetchIncidents(statusFilter = null) {
  try {
    const url = statusFilter
      ? `${API_BASE_URL}/api/incidents?status_filter=${encodeURIComponent(statusFilter)}`
      : `${API_BASE_URL}/api/incidents`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch incidents (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error('API Error [fetchIncidents]:', err);
    throw err;
  }
}

/**
 * Fetch a single incident by ID
 */
export async function fetchIncidentById(incidentId) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}`
    );
    if (!res.ok) {
      throw new Error(
        `Failed to fetch incident details for ${incidentId} (HTTP ${res.status})`
      );
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [fetchIncidentById:${incidentId}]:`, err);
    throw err;
  }
}

/**
 * Create a new incident
 */
export async function createIncident(incidentData) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incidentData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to create incident (HTTP ${res.status})`
      );
    }
    return await res.json();
  } catch (err) {
    console.error('API Error [createIncident]:', err);
    throw err;
  }
}

/**
 * Trigger AI analysis for an incident (Mock AI response)
 */
export async function analyzeIncident(incidentId) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}/analyze`,
      {
        method: 'POST',
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          `Failed to analyze incident ${incidentId} (HTTP ${res.status})`
      );
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [analyzeIncident:${incidentId}]:`, err);
    throw err;
  }
}

/**
 * Mark an incident as resolved
 */
export async function resolveIncident(incidentId) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/incidents/${encodeURIComponent(incidentId)}/resolve`,
      {
        method: 'POST',
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
          `Failed to resolve incident ${incidentId} (HTTP ${res.status})`
      );
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [resolveIncident:${incidentId}]:`, err);
    throw err;
  }
}

/**
 * Query Hindsight memory bank for stored incident post-mortems
 */
export async function fetchMemory(limit = 50) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/memory?limit=${limit}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch memories (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error('API Error [fetchMemory]:', err);
    throw err;
  }
}

/**
 * Search Hindsight memory bank via recall endpoint
 */
export async function searchMemory(query) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/memory/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) {
      throw new Error(`Failed to search memory (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error('API Error [searchMemory]:', err);
    throw err;
  }
}

/**
 * Query categorized memories from Hindsight
 */
export async function fetchMemoryCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/memory/categories`);
    if (!res.ok) {
      throw new Error(`Failed to fetch memory categories (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error('API Error [fetchMemoryCategories]:', err);
    throw err;
  }
}

/**
 * Query memory timeline milestones from Hindsight
 */
export async function fetchMemoryTimeline() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/memory/timeline`);
    if (!res.ok) {
      throw new Error(`Failed to fetch memory timeline (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error('API Error [fetchMemoryTimeline]:', err);
    throw err;
  }
}

/**
 * Reset demo incident INC-204 for live demonstration
 */
export async function resetDemoIncident() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/demo/reset`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(`Failed to reset demo incident (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err) {
    console.error('API Error [resetDemoIncident]:', err);
    throw err;
  }
}

