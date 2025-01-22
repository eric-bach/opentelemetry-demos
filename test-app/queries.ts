export const queryGetAllFlights = () => {
  let query = `SELECT f.id, f.origin, f.destination, f.airline, f.departing `;
  query += `FROM dbo.flight f `;

  return query;
};

export const queryGetFlightById = () => {
  let query = `SELECT f.id, f.origin, f.destination, f.airline, f.departing `;
  query += `FROM dbo.flight f `;
  query += `WHERE f.id= @flightId`;

  return query;
};
