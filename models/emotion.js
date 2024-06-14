const inverseEncodeEmotion = (index) => {
  switch (index) {
    case 0:
      return "Anger";
    case 1:
      return "Happiness";
    case 2:
      return "Love";
    case 3:
      return "Sadness";
    case 4:
      return "Worry";
    default:
      return "Unknown";
  }
};

module.exports = { inverseEncodeEmotion };
