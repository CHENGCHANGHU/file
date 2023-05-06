# #golden-tiger/fstree

Use ASCII code to display the file system tree with stat data.

## Usage

1. `git clone git@github.com:CHENGCHANGHU/fstree.git`
2. `pnpm install` or `npm install`
3. `npm link`

## Arguments

1. `--exclude` or `-e`: this argument is used to construct RegExp which will be excluded from the file system tree.
2. `--format` or `-f`: this argument is used to format the display text of every file or directory.
  > It supports `type`(`d`, `l`, `-`), `name`, `size`, `\t` in format string now.

## Example

`fstree -e "node_modules .git" -f "(type) name\t(size)" path/to/a`

```
Display of File System Tree at path/to/a:
(d) a/  (393.00 B)
|- (d) b/       (201.00 B)
|  |- (d) d/    (64.00 B)
|  `- (-) e.txt (9.00 B)
`- (d) c/       (64.00 B)
```
