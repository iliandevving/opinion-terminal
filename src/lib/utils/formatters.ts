export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
};

export const getCategoryEmoji = (category: string): string => {
  switch (category?.toLowerCase()) {
    case "crypto":
    case "cryptocurrency":
      return "₿";
    case "politics":
    case "election":
      return "🗳️";
    case "sports":
      return "⚽";
    case "pop-culture":
    case "entertainment":
      return "🎭";
    case "business":
    case "economics":
      return "💼";
    case "science":
      return "🔬";
    case "technology":
      return "💻";
    default:
      return "📊";
  }
};
