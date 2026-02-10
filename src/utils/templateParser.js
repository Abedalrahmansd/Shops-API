// src/utils/templateParser.js
import _ from 'lodash';

export const parseMessageTemplate = (template, data) => {
  // Custom parser for %%foreach products: ...%%
  const foreachRegex = /%%foreach products:(.*?)%%/gs;
  template = template.replace(foreachRegex, (match, content) => {
    return data.products.map(product => {
      return content.replace(/\$product/g, product.title).replace(/\$quantity/g, product.quantity);
    }).join('\n');
  });

  // Then use lodash.template for other {{vars}}
  const compiled = _.template(template);
  return compiled({
    total: data.total,
    // Add more vars as needed
  });
};

// Example usage:
// template = 'السلام عليكم\n%%foreach products: $product: $quantity\n%%\nالاجمالي: {{total}}'
// data = { products: [{title: 'Item1', quantity: 2}], total: 50 }
// Output: 'السلام عليكم\nItem1: 2\n\nالاجمالي: 50'