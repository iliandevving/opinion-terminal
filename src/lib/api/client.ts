class ApiClient {
  private cache: Map<string, unknown> = new Map();

  clearCache(): void {
    this.cache.clear();
  }
}

export const apiClient = new ApiClient();
