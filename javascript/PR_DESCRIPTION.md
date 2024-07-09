# Pull Request: Refactor Airport Logic

## Summary
This pull request refactors the logic in the `Airport.tsx` file to improve code quality, maintainability, and adherence to best practices. The changes include the removal of console.logs and comments, the implementation of error handling using toast notifications, and the use of Tailwind for UI styling. Additionally, the test suite has been updated to reflect these changes and ensure proper functionality.

## Changes Made
- Refactored `Airport.tsx`:
  - Removed all `console.log` statements and comments.
  - Implemented error handling using `react-toastify` for toast notifications.
  - Updated state management using React's `useState` hook.
  - Centralized error handling in `handleLand` and `handleTakeOff` functions.
  - Removed unnecessary `async` keywords.
  - Defined a type for `PlaneInstance`.
  - Styled the UI using Tailwind CSS.

- Updated `Airport.test.tsx`:
  - Removed checks for success messages and focused on verifying UI state updates and error notifications.
  - Improved test reliability by separating assertions within `waitFor` callbacks.
  - Added assertions to check the hangar count after each landing attempt.

## Rationale
The refactoring aims to enhance the readability, maintainability, and performance of the codebase. By following React and TypeScript best practices, the code is now more consistent and easier to understand. The use of toast notifications for error handling provides a better user experience, and the adoption of Tailwind CSS ensures a consistent and modern UI design.

## Testing
The test suite has been updated to reflect the changes made in the `Airport.tsx` file. All tests have been run to ensure that the refactored logic works as expected. The tests cover various scenarios, including landing and taking off planes, updating the hangar state, and displaying error notifications.

## Next Steps
- Review the changes and provide feedback.
- Merge the pull request once the review is complete.
- Ensure that the updated logic is deployed and tested in the production environment.

Thank you for reviewing this pull request. Please let me know if you have any questions or need further clarification on any of the changes made.
