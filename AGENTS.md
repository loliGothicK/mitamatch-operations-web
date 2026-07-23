<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:strict-housekeeping-rules -->
# Strict Housekeeping & Cleanup

Before concluding any task or reporting completion to the user, you MUST perform the following cleanup steps:

1. **Never Report Completion Prematurely**: Do not say "I'm done" or claim a task is finished until you have actually executed, tested, linted, and typechecked your changes.
2. **Run Static Analysis & Typechecks**: Always run the project's linter (e.g., `pnpm lint`) and TypeScript compiler (e.g., `pnpm tsc --noEmit` or equivalent) to detect unused variables, missing imports, or syntax/type warnings introduced by your edits. Fix all warnings and errors you caused before stopping.
3. **Execute and Test**: Run the relevant code or tests to verify your implementation actually works in practice, rather than assuming it works based on the source code.
4. **Remove Temporary Files**: If you created any temporary scripts (e.g., node scripts to parse JSON or test logic) or **dumped command outputs to text files (e.g., `lint-output.txt`)** inside the project directory, you MUST delete them using `rm` immediately after use. Never leave garbage files behind.
5. **Clean Up Associated Dead Code**: If you remove a feature, component, or UI element, proactively search for and delete all associated dead code. This strictly includes removing orphaned localization keys from translation files (`en/translation.json`, `ja/translation.json`, etc.).
6. **Remove Temporary Debugging Code**: If you added temporary logs (e.g., `console.log`, `console.error`) or experimental code to debug an issue, you MUST remove them and restore the code to its original clean state before reporting completion.
<!-- END:strict-housekeeping-rules -->

<!-- BEGIN:i18n-consistency -->
# i18n Translation Consistency

When adding new user-facing features, components, or widgets, you MUST ensure that all new translation keys are added to ALL localization files (e.g., public/locales/ja/translation.json and public/locales/en/translation.json). Never leave raw i18n keys exposed in the UI.
<!-- END:i18n-consistency -->

<!-- BEGIN:mui-stack-props-rule -->
# MUI Stack System Props

When writing or fixing MUI components—especially to resolve React DOM prop warnings like "React does not recognize the `alignItems` prop on a DOM element":
1. **Use `sx` for System Props**: Do NOT pass layout system props (e.g., `alignItems`, `justifyContent`) as direct props on `<Stack>`. Always pass them inside the `sx` prop instead (e.g., `<Stack direction="row" sx={{ alignItems: 'center' }}>`).
2. **Preserve Component Semantics**: Do NOT lazily replace `<Stack>` with `<Box sx={{ display: 'flex' }}>` just to bypass the warning. Maintain the user's semantic choices.
<!-- END:mui-stack-props-rule -->

<!-- BEGIN:frontend-telemetry-rule -->
# Frontend Telemetry & Error Handling (OTel & Sentry)

When creating or modifying frontend services (e.g., fetching or mutating data in `services/*.ts`), you MUST implement proper observability and error handling. NEVER throw generic errors and expect the user to debug via browser console.
1. **Trace Operations**: Wrap asynchronous operations using `withSpan` from `@/lib/otel`. Use a consistent naming convention like `ui.<domain>.<action>`.
2. **Capture API Errors**: If an API response is not `ok`, extract the error text (e.g., `res.text()`) and use `Sentry.captureException(err, { extra: { ... } })` to send the failure to Sentry. Include relevant context in the `extra` field, such as `res.status`, `dashboardId`, and the request payload. Mark the OTel span as failed (`span.setAttribute("error", true)`).
<!-- END:frontend-telemetry-rule -->

<!-- BEGIN:pokemon-domain-constraint-rule -->
# Domain Context: Pokémon Champions

This entire application strictly targets "Pokémon Champions". 
1. **No Irrelevant Pokémon**: NEVER mention, use, or hardcode modern Pokémon (e.g., SV / Gen 9 Pokémon like flutter-mane) in code, seed data, examples, or general conversation.
2. **Source of Truth**: When specific Pokémon data or slugs are needed, always verify valid identifiers by checking the JSON data files (e.g., `apps/web/data/champions/pokemon.json`).
<!-- END:pokemon-domain-constraint-rule -->

<!-- BEGIN:mui-responsive-overrides -->
# Responsive Styling & Snapshot Testing

1. **Mandatory Snapshot Testing**: If a requested style change is restricted to a specific viewport (e.g., mobile only or desktop only), **you MUST write and run a snapshot test for the component to lock in the baseline appearance of the unaffected viewport BEFORE making any changes to the source code.** You are forbidden from beginning the work until this snapshot test is established. Failure to do so will result in immediate denial of the task.
2. **Safe Mobile Overrides**: When applying mobile-specific overrides to an existing component's `sx` prop, **do NOT explicitly re-declare the desktop (`md`) value** unless you are completely altering the behavior. Use `{ xs: 'override' }` and omit `md`. This ensures the desktop view safely inherits the component's original defaults without accidentally stripping properties.
3. **Hidden Utility Padding**: When debugging stubborn margin/padding issues, check if custom styled wrappers or utility functions (like `rounded()`) are injecting silent `px` or `py` values. You must explicitly override these (e.g., `p: 0`) rather than just removing padding from parent containers.
<!-- END:mui-responsive-overrides -->
