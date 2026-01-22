// Fetches NYT Wordle answers from Rock Paper Shotgun
// Note: This is a basic implementation. In production, you may want to use
// a more robust HTML parser or maintain a static list that's updated periodically.

export async function fetchNYTWords(): Promise<string[]> {
  try {
    const response = await fetch("https://www.rockpapershotgun.com/wordle-past-answers");
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract words from the HTML
    // The page typically lists words in a specific format
    // This regex looks for 5-letter uppercase words
    const wordMatches = html.match(/\b[A-Z]{5}\b/g);
    
    if (!wordMatches) {
      throw new Error("No words found in HTML");
    }

    // Filter to unique words and ensure they're exactly 5 letters
    const words = Array.from(new Set(wordMatches))
      .filter(word => word.length === 5)
      .map(word => word.toUpperCase())
      .sort();

    return words;
  } catch (error) {
    console.error("Error fetching NYT words:", error);
    // Return empty array on error - admin can import manually
    return [];
  }
}

// Alternative: Parse from a more structured source if available
export async function fetchNYTWordsFromJSON(): Promise<string[]> {
  // If there's a JSON API or structured data source, use that instead
  // For now, return empty array
  return [];
}
