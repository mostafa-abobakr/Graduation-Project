export const formatNumber = (num, isArabic, options = {}) => {
  const isEGP = options.style === 'currency' && options.currency === 'EGP';
  
  const mergedOptions = {
    ...(isEGP ? { maximumFractionDigits: 0 } : {}),
    ...options
  };

  if (!isArabic) {
    if (isEGP) {
      const { style, currency, ...restOptions } = mergedOptions;
      const formattedNumber = new Intl.NumberFormat('en-US', { ...restOptions, style: 'decimal' }).format(num);
      return `${formattedNumber} EGP`;
    }
    return new Intl.NumberFormat('en-US', mergedOptions).format(num);
  }
  
  return new Intl.NumberFormat('ar-EG', {
    ...mergedOptions,
    numberingSystem: 'arab'
  }).format(num);
};
