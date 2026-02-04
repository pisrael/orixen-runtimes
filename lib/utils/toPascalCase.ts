export function toPascalCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .split(/\s+/)
    .map(word => {
      const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
      if (!cleanWord) return '';
      return cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
    })
    .join('');
}
