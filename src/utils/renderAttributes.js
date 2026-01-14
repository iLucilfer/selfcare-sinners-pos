function getUIHints(product) {
  if (product.attributes && product.attributes.ui) {
    return product.attributes.ui;
  }
  const inferred = [];
  if (product.attributes) {
    for (const k of Object.keys(product.attributes)) {
      inferred.push({ key: k, label: k, type: typeof product.attributes[k] === 'number' ? 'number' : 'text' });
    }
  }
  return inferred;
}

module.exports = { getUIHints };
