export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const { FORMSPREE_URL } = process.env;
  if (!FORMSPREE_URL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Formspree URL not configured.' }),
    };
  }

  try {
    const response = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: event.body,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error submitting to Formspree:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'An internal server error occurred.' }),
    };
  }
};