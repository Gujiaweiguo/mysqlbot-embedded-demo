const providers = new Map();

function registerProvider(provider) {
  providers.set(String(provider.id), provider);
}

function getAllProviders() {
  return Array.from(providers.values());
}

function getDefaultProviders() {
  return getAllProviders().filter((provider) => !!provider.defaultSelected);
}

function findProvidersByIds(ids) {
  const idSet = new Set((ids || []).map((id) => String(id)));
  return getAllProviders().filter((provider) => idSet.has(String(provider.id)));
}

module.exports = {
  registerProvider,
  getAllProviders,
  getDefaultProviders,
  findProvidersByIds,
};
