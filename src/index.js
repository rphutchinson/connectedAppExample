import chalk from "chalk";
import "dotenv/config";
import main from "./main";


if (process.env.NODE_ENV === "development") {
  console.log(
    chalk.black.bgGreen.bold(
      "========= Loading Environment from .env =========="
    )
  );
}

main();

