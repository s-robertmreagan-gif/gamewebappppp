function doGet(e) {
  const gameId = e && e.parameter ? e.parameter.game : null;

  if (gameId) {
    return serveGame(gameId);
  }

  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("ArcadeHub")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getGameFolder() {
  const folders = DriveApp.getFoldersByName("ArcadeHub Games");

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.createFolder("ArcadeHub Games");
}

function uploadGame(game) {
  if (!game || !game.name || !game.html) {
    throw new Error("Missing game information.");
  }

  if (game.html.length > 1000000) {
    throw new Error("Game is larger than 1 MB.");
  }

  const folder = getGameFolder();

  const safeName = game.name
    .replace(/[\\/:*?"<>|]/g, "")
    .trim()
    .substring(0, 80);

  const file = folder.createFile(
    safeName + ".html",
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
    id: file.getId()
  };
}

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
      const metadata = JSON.parse(
        description
          .replace("ARCADEHUB_GAME", "")
          .trim()
      );

      games.push({
        id: file.getId(),
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        icon: metadata.icon,
        uploaded: metadata.uploaded
      });

    } catch (err) {
      console.log(err);
    }
  }

  return games;
}

function serveGame(gameId) {
  try {
    const file = DriveApp.getFileById(gameId);
    const html = file.getBlob().getDataAsString();

    return HtmlService
      .createHtmlOutput(html)
      .setTitle(file.getName())
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );

  } catch (err) {
    return HtmlService.createHtmlOutput(
      "<h2>Unable to load game.</h2>"
    );
  }
}
