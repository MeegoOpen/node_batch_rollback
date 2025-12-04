const { execSync } = require('child_process');
const fs = require('fs');
const inquirer = require('inquirer');

const distManifest = 'plugin.config.json';

const runCmd = (cmd) => {
  execSync(cmd, { stdio: 'inherit' }); // ignore_security_alert
};


(async () => {
  try {
    let [, , action, token] = process.argv;
    if (!action) {
      const answers = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'Please select "action":',
        default: 2,
        choices: ['start', 'build', 'deploy'],
      }, ]);

      action = answers.action;
      console.log('Action is: ', action);
    }

    // Check if plugin.config.json exists
    if (!fs.existsSync(distManifest)) {
      console.error(`Error: ${distManifest} not found in the root directory.`);
      console.error('Please make sure the file exists before running this script.');
      process.exit(1);
    }

    // Read the manifest config directly
    let manifestConfig = JSON.parse(fs.readFileSync(distManifest, 'utf8'));

    switch (action) {
      case 'deploy':
        runCmd(`lpm release ${token}`);
        console.log(
          '\nPlease goto here to deploy: \n\n\x1b[36m%s\x1b[0m\n',
          `${manifestConfig.siteDomain}/openapp/${manifestConfig.pluginId}#versions`,
        );
        break;
      default:
        runCmd(`lpm ${action}`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();