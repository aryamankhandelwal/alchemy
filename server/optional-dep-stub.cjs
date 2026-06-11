// Bundle-time stand-in for optional native deps (kerberos, snappy, gcp-metadata…)
// that aren't installed. The mongodb driver requires them inside try/catch, so
// throwing here marks them "unavailable" exactly like a missing module would.
throw new Error('optional dependency not available (stubbed at bundle time)')
