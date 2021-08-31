### Basic
```yaml
steps:
  - uses: actions/checkout@v2
  - uses: keviswang/setup-graalvm@v1
    with:
      java-version: 11
      graalvm-version: 21.1.0
      native-image: true
  - run: java -version
```

## Configuration
| Property          | Required | Default | Description |
|-------------------|----------|---------|-------------|
| `java-version`    | Yes      |         | A major Java version. Only `8`, `11` and `16` (targeting GraalVM v21.1.0) are supported. |
| `graalvm-version` | Yes      |         | A GraalVM release. Supported values are `21.1.0`, `21.0.0.2`, `21.0.0`, `20.3.2`, `20.3.1.2`, `20.3.1`, `20.3.0`, `20.2.0`, `20.1.0`, `20.0.1`, `20.0.0`, `19.3.2`, `19.3.1`, `19.3.0.2` and `19.3.0`. See [GraalVM releases](https://github.com/graalvm/graalvm-ce-builds/releases) |
| `native-image`    | No       | `false` | `true` to download GraalVM `native-image`. |
