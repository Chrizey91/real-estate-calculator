export default [
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                Chart: "readonly",
                module: "readonly",
                require: "readonly",
                process: "readonly",
                __dirname: "readonly",
                Intl: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-console": "off"
        }
    }
];
