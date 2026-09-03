const GAME_FOLDER_NAME = "ArcadeHub Games";

function doGet(e) {
  const gameId = e && e.parameter ? e.parameter.game : null;

  if (gameId) {
    return serveGame(gameId);
  }

  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("ArcadeHub")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/*
 * Gets or creates the Google Drive folder
 * where uploaded games are stored.
 */
function getGameFolder() {
  const folders = DriveApp.getFoldersByName(GAME_FOLDER_NAME);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder(GAME_FOLDER_NAME);
}


/*
 * Upload a game.
 */
function uploadGame(game) {

  if (!game || !game.name || !game.html) {
    throw new Error("Missing game information.");
  }

  if (!game.html.trim().toLowerCase().startsWith("<!doctype") &&
      !game.html.trim().toLowerCase().startsWith("<html")) {
    throw new Error("The uploaded file does not appear to be an HTML file.");
  }

  // 1 MB limit
  if (game.html.length > 1000000) {
    throw new Error("Game is too large. Maximum size is 1 MB.");
  }

  const folder = getGameFolder();

  const safeName = game.name
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
    .substring(0, 80);

  const fileName = safeName + ".html";

  const file = folder.createFile(
    fileName,
    game.html,
    MimeType.HTML
  );

  const metadata = {
    name: safeName,
    description: game.description || "Uploaded game",
    category: game.category || "other",
    icon: game.icon || "🎮",
    uploaded: new Date().toISOString()
  };

  file.setDescription(
    "ARCADEHUB_GAME\n" +
    JSON.stringify(metadata)
  );

  return {
    success: true,
    id: file.getId(),
    name: metadata.name
  };
}


/*
 * Get every uploaded game.
 */
function getGames() {

  const folder = getGameFolder();
  const files = folder.getFiles();

  const games = [];

  while (files.hasNext()) {

    const file = files.next();

    const description = file.getDescription() || "";

    if (!description.startsWith("ARCADEHUB_GAME")) {
      continue;
    }

    try {

      const json = description
        .replace("ARCADEHUB_GAME", "")
        .trim();

      const metadata = JSON.parse(json);

      games.push({
        id: file.getId(),
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        icon: metadata.icon,
        uploaded: metadata.uploaded
      });

    } catch (error) {

      console.log(
        "Could not read game metadata: " +
        file.getName()
      );

    }
  }

  games.sort(function(a, b) {
    return new Date(b.uploaded) -
           new Date(a.uploaded);
  });

  return games;
}


/*
 * Serve an uploaded game.
 */
function serveGame(gameId) {

  try {

    const file = DriveApp.getFileById(gameId);

    const folder = getGameFolder();

    // Make sure the file is actually inside
    // the ArcadeHub Games folder.
    const parents = file.getParents();

    let valid = false;

    while (parents.hasNext()) {

      if (parents.next().getId() === folder.getId()) {
        valid = true;
        break;
      }

    }

    if (!valid) {
      return HtmlService.createHtmlOutput(
        "<h2>Game not found.</h2>"
      );
    }

    const html = file.getBlob()
      .getDataAsString();

    return HtmlService
      .createHtmlOutput(html)
      .setTitle(file.getName())
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );

  } catch (error) {

    return HtmlService.createHtmlOutput(
      "<h2>Unable to load game.</h2>"
    );

  }
}
