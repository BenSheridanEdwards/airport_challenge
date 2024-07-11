# Airport Challenge

``````
        ______
        _\____\___
=  = ==(____MA____)
          \_____\___________________,-~~~~~~~`-.._
          /     o o o o o o o o o o o o o o o o  |\_
          `~-.__       __..----..__                  )
                `---~~\___________/------------`````
                =  ===(_________)
``````

## Introduction

This project is a challenge from Makers Academy to write software that controls the flow of planes at an airport. The planes can land and take off provided that the weather is sunny. Occasionally it may be stormy, in which case no planes can land or take off. The project includes both a Ruby version and a JavaScript version, each with a full test suite. To ensure code quality and maintain high test coverage, a Husky pre-push hook has been implemented in the JavaScript version of the project. This hook runs all unit tests before each push to the repository, preventing any code that fails tests from being pushed.

## What I Did

I (Ben) have made the project my own by implementing the following features and improvements:
- Developed a React application using TypeScript for the JavaScript version.
- Ensured high test coverage (84.28% for statements, 73.91% for branches, and 90% for functions) for the JavaScript version and over 95% for the Ruby version.
- Updated the stormy weather error messages for clarity.
- Reorganized test files to be inside their respective component folders.
- Updated test functions to use `async/await` and `userEvent` for better testing practices.

## Build Instructions

### JavaScript Version

1. Fork this repo, and clone to your local machine.
2. Navigate to the `/javascript` folder.
3. Run the command `npm install` to install all dependencies.
4. Run the command `npm run prepare` to install Husky and set up the pre-push hook.
5. Run the command `npm start` to start the development server.
6. Open your browser and navigate to `http://localhost:3000` to view the app.
7. Run the command `npm test` to execute the test suite.

### Troubleshooting

If you encounter any issues during the Husky installation, consider the following steps:
- Ensure that you have the latest version of Node.js and npm installed.
- Verify that the `.husky` directory and `pre-push` file have the correct permissions (e.g., `chmod +x .husky/pre-push`).
- Check the Husky documentation for additional troubleshooting tips: https://typicode.github.io/husky/#/

### Ruby Version

1. Fork this repo, and clone to your local machine.
2. Run the command `gem install bundle` (if you don't have bundle already).
3. When the installation completes, run `bundle install`.
4. Run the command `rspec` to execute the test suite.

## Husky Pre-Push Hook

To ensure code quality and maintain high test coverage, a Husky pre-push hook has been implemented in the JavaScript version of the project. This hook runs all unit tests before each push to the repository, preventing any code that fails tests from being pushed.

### Setup

The Husky pre-push hook is set up as follows:
1. Husky is installed in the JavaScript directory of the project.
2. A `pre-push` file is added to the `.husky` directory with the command to run tests before each push.
3. The `package.json` file includes a "prepare" script for Husky installation.

### Verification

To verify that the Husky pre-push hook is working correctly:
1. Make a change to the code in the JavaScript directory.
2. Attempt to push the changes to the repository.
3. The pre-push hook will automatically run `npm test` to execute the test suite.
4. If all tests pass, the changes will be pushed successfully. If any tests fail, the push will be aborted, and the test failures will be displayed.

This setup ensures that only code that passes all unit tests can be pushed to the repository, maintaining code quality and reliability.
## Additional Details

- The JavaScript version of the project uses React and TypeScript.
- The JavaScript version has a full test suite with 80% test coverage for statements and lines, and 63.63% for branches. The Ruby version has over 95% test coverage.
- To ensure code quality and maintain high test coverage, a Husky pre-push hook has been implemented in the JavaScript version of the project. This hook runs all unit tests before each push to the repository, preventing any code that fails tests from being pushed.
- The project includes user stories that were worked out in collaboration with the client to ensure the software meets their requirements.

## User Stories

```
As an air traffic controller
So I can get passengers to a destination
I want to instruct a plane to land at an airport

As an air traffic controller
So I can get passengers on the way to their destination
I want to instruct a plane to take off from an airport and confirm that it is no longer in the airport

As an air traffic controller
To ensure safety
I want to prevent landing when the airport is full

As the system designer
So that the software can be used for many different airports
I would like a default airport capacity that can be overridden as appropriate

As an air traffic controller
To ensure safety
I want to prevent takeoff when weather is stormy

As an air traffic controller
To ensure safety
I want to prevent landing when weather is stormy
```

Your task is to test drive the creation of a set of classes/modules to satisfy all the above user stories. You will need to use a random number generator to set the weather (it is normally sunny but on rare occasions it may be stormy). In your tests, you'll need to use a stub to override random weather to ensure consistent test behaviour.

Your code should defend against [edge cases](http://programmers.stackexchange.com/questions/125587/what-are-the-difference-between-an-edge-case-a-corner-case-a-base-case-and-a-b) such as inconsistent states of the system ensuring that planes can only take off from airports they are in; planes that are already flying cannot take off and/or be in an airport; planes that are landed cannot land again and must be in an airport, etc.

For overriding random weather behaviour, please read the documentation to learn how to use test doubles: https://www.relishapp.com/rspec/rspec-mocks/docs . There’s an example of using a test double to test a die that’s relevant to testing random weather in the test.

Please create separate files for every class, module and test suite.

In code review we'll be hoping to see:

- All tests passing
- High [Test coverage](https://github.com/makersacademy/course/blob/master/pills/test_coverage.md) (>95% is good)
- The code is elegant: every class has a clear responsibility, methods are short etc.

Reviewers will potentially be using this [code review rubric](docs/review.md). Referring to this rubric in advance will make the challenge somewhat easier. You should be the judge of how much challenge you want this weekend.

**BONUS**

- Write an RSpec **feature** test that lands and takes off a number of planes

Note that is a practice 'tech test' of the kinds that employers use to screen developer applicants. More detailed submission requirements/guidelines are in [CONTRIBUTING.md](CONTRIBUTING.md)

Finally, don’t over complicate things. This task isn’t as hard as it may seem at first.

- **Submit a pull request early.** There are various checks that happen automatically when you send a pull request. **Fix these issues if you can**. Green is good.

- Finally, please submit a pull request before Monday at 9am with your solution or partial solution. However much or little amount of code you wrote please please please submit a pull request before Monday at 9am.
```
