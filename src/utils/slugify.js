import _ from 'lodash';

export const slugify = (string) => {
  return _.kebabCase(string.toLowerCase()) + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
};

// Example: slugify('My Shop Title') => 'my-shop-title-1234'