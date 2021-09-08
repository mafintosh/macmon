# macmon

Simple, no deps, "run on dir change" tool for Mac

```
npm install -g macmon
```

## Usage

```sh
# runs `node index.js` everytime cwd (recursively) changes
macmon node index.js
```

If you want to watch another dir than `cwd`, use `-w`

```sh
# same as above but watches ../ recursively
macmon -w ../ node index.js
```

You can specify as many directories to watch as you prefer using multiple `-w` arguments.

## License

MIT
