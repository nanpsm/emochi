import sql from "mssql";

function parseConnectionString(url) {
  const trimmed = url.trim();
  // Debug: log char codes to see if there are hidden quote characters
  // Strip surrounding quotes — handles straight " (U+0022) and curly " " (U+201C/U+201D)
  const isOpenQuote = (c) => c === '"' || c === '“';
  const isCloseQuote = (c) => c === '"' || c === '”';
  const clean = isOpenQuote(trimmed[0]) && isCloseQuote(trimmed[trimmed.length - 1])
    ? trimmed.slice(1, -1)
    : trimmed;
  // sqlserver://host:port;param=value;...
  const withoutScheme = clean.replace(/^sqlserver:\/\//, "");
  const [hostPort, ...rest] = withoutScheme.split(";");
  const [server, port] = hostPort.split(":");
  const params = Object.fromEntries(
    rest
      .filter((p) => p.includes("="))
      .map((part) => {
        const idx = part.indexOf("=");
        return [part.slice(0, idx).toLowerCase(), part.slice(idx + 1)];
      })
  );
  return {
    server,
    port: port ? parseInt(port) : 1433,
    database: params.database,
    user: params.user,
    password: params.password,
    options: {
      encrypt: params.encrypt !== "false",
      trustServerCertificate: params.trustservercertificate === "true",
    },
  };
}

let pool = null;

export async function getPool() {
  if (pool) return pool;
  const config = parseConnectionString(process.env.DATABASE_URL ?? "");
  try {
    pool = await sql.connect(config);
  } catch (err) {
    pool = null; // reset so next request retries
    throw err;
  }
  return pool;
}

export { sql };
