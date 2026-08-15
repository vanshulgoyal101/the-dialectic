const STOP_WORDS = new Set([
  'the', 'and', 'that', 'with', 'from', 'this', 'they', 'have', 'were', 'your',
  'what', 'will', 'about', 'there', 'their', 'would', 'which', 'these', 'could',
  'should', 'other', 'them', 'then', 'some', 'into', 'than', 'only', 'most',
  'such', 'more', 'when', 'who', 'how', 'where', 'why', 'been', 'being', 'have',
  'has', 'had', 'does', 'doing', 'done', 'shall', 'should', 'will', 'would',
  'must', 'cannot', 'could', 'may', 'might', 'need', 'ought', 'through',
  'between', 'under', 'over', 'onto', 'upon', 'after', 'before', 'above',
  'below', 'against', 'during', 'without', 'within', 'around', 'afterwards',
  'already', 'although', 'always', 'among', 'another', 'anyway', 'because',
  'become', 'becomes', 'becoming', 'besides', 'beyond', 'describe', 'detail',
  'either', 'else', 'elsewhere', 'empty', 'enough', 'etc', 'even', 'ever',
  'every', 'everyone', 'everything', 'everywhere', 'except', 'few', 'find',
  'first', 'five', 'former', 'formerly', 'forty', 'found', 'four', 'further',
  'get', 'give', 'go', 'hence', 'her', 'here', 'hereafter', 'hereby', 'herein',
  'hereupon', 'hers', 'herself', 'him', 'himself', 'his', 'however', 'hundred',
  'indeed', 'interest', 'itself', 'keep', 'last', 'latter', 'latterly', 'least',
  'less', 'made', 'many', 'meanwhile', 'mine', 'moreover', 'mostly', 'move',
  'much', 'myself', 'name', 'namely', 'neither', 'never', 'nevertheless',
  'next', 'nine', 'nobody', 'none', 'noone', 'nor', 'nothing', 'now', 'nowhere',
  'off', 'often', 'once', 'only', 'others', 'otherwise', 'ours', 'ourselves',
  'own', 'part', 'per', 'perhaps', 'please', 'put', 'rather', 'same', 'see',
  'seem', 'seemed', 'seeming', 'seems', 'serious', 'several', 'she', 'show',
  'side', 'since', 'sincere', 'six', 'sixty', 'somehow', 'someone', 'something',
  'sometime', 'sometimes', 'somewhere', 'still', 'system', 'take', 'ten',
  'thank', 'themselves', 'thence', 'thereafter', 'thereby', 'therefore',
  'therein', 'thereupon', 'these', 'they', 'thick', 'thin', 'third', 'those',
  'though', 'three', 'throughout', 'thru', 'thus', 'together', 'too', 'top',
  'toward', 'towards', 'twelve', 'twenty', 'unless', 'until', 'upon', 'very',
  'via', 'well', 'whatever', 'whence', 'whenever', 'whereafter', 'whereas',
  'whereby', 'wherein', 'whereupon', 'wherever', 'whether', 'while', 'whither',
  'whoever', 'whole', 'whom', 'whose', 'yours', 'yourself', 'yourselves',
  'just', 'like', 'also', 'instead', 'both', 'each', 'make', 'makes', 'took',
  'come', 'comes', 'came', 'doesnt', 'cannot', 'cant', 'dont', 'doesnt',
  'isnt', 'arent', 'wasnt', 'werent', 'havent', 'hasnt', 'hadnt', 'wont',
  'says', 'said', 'saying', 'look', 'looks', 'looking', 'point', 'points',
  'question', 'questions', 'answer', 'answers', 'argument', 'arguments',
  'debate', 'position', 'positions', 'claim', 'claims', 'view', 'views',
  'think', 'thinks', 'thinking', 'thought', 'thoughts', 'mere', 'merely',
  'rather', 'pure', 'purely', 'simply', 'simple', 'complex', 'complexity'
]);

export function cleanWord(word: string): string {
  // Strip non-alphabetic chars from the beginning and end of the word
  return word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
}

export function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Match sequences of letters
  const rawWords = text.match(/[a-zA-Z]+/g) || [];
  const uniqueKeywords = new Set<string>();

  for (const rawWord of rawWords) {
    const cleaned = cleanWord(rawWord).toLowerCase();
    
    // Filter by length and stop words list
    if (cleaned.length >= 4 && !STOP_WORDS.has(cleaned)) {
      // Capitalize the first letter
      const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      uniqueKeywords.add(capitalized);
    }
  }

  return Array.from(uniqueKeywords);
}
