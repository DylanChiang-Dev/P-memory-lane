export interface AnilistResult {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  coverImage: {
    large: string;
    medium: string;
  };
  startDate: {
    year: number;
  };
  averageScore: number;
  episodes: number;
  status: string;
}

export async function searchAnime(query: string): Promise<AnilistResult[]> {
  const queryGraphQL = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          startDate {
            year
          }
          averageScore
          episodes
          status
        }
      }
    }
    `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: queryGraphQL,
        variables: { search: query }
      })
    });

    const data = await response.json();

    if (!data.data || !data.data.Page || !data.data.Page.media) {
      return [];
    }

    return data.data.Page.media;
  } catch (error) {
    console.error('Error searching Anilist:', error);
    return [];
  }
}

export async function getAnimeDetails(id: number): Promise<AnilistResult | null> {
  const queryGraphQL = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
        }
        startDate {
          year
        }
        averageScore
        episodes
        status
      }
    }
    `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: queryGraphQL,
        variables: { id }
      })
    });

    const data = await response.json();

    if (!data.data || !data.data.Media) {
      return null;
    }

    return data.data.Media;
  } catch (error) {
    console.error('Error fetching Anilist details:', error);
    return null;
  }
}
