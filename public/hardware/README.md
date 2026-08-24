# Managing the hardware finishes

The 4 hardware options shown in the collar builder (Silver, Gold, Black,
Brass) come from **`catalogue.json`** in this folder — the same idea as
`public/patterns/catalogue.json` for fabrics. Edit that one file to add a new
finish, rename one, or mark one out of stock.

## Editing on GitHub (no software to install)

1. Open `public/hardware/catalogue.json` on github.com and click the pencil
   (✏️) icon to edit.
2. Make your change, then **Commit changes** — the live site updates
   automatically.
3. To add a new photo: open the `public/hardware` folder, click **Add file →
   Upload files**, and drag the image in.

## The file format

```json
{
  "code": "silver",
  "name_cz": "Stříbrné",
  "name_en": "Silver",
  "status": "active",
  "image": "silver.png"
}
```

| Field | What it means |
|---|---|
| `code` | A short unique ID. Must not repeat across entries — don't change an existing one when renaming or editing. |
| `name_cz` / `name_en` | The name shown to customers, in each language. |
| `note_cz` / `note_en` | *(optional — only add these two lines if needed)* A small note under the name. Leave both out for a finish with no note. |
| `status` | `"active"` (selectable), `"out_of_stock"` (shown greyed out with an "Out of stock" label, can't be selected), or `"hidden"` (removed from the site entirely). |
| `image` | The exact filename of the photo in this folder — spelling, spaces, and capital letters all have to match. |

### Note on the 40mm width rule

The site has a separate rule that 40mm-width collars can currently only use
silver hardware — this locks automatically whenever a customer picks 40mm,
regardless of what's in this file. If you ever mark silver `"out_of_stock"`
or `"hidden"`, double check the 40mm option still makes sense, since that
rule assumes silver is available.

### Before saving

Every entry needs a comma after its closing `}` except the very last one,
and text always goes in double quotes. If the site looks broken after an
edit, compare your change against a working entry — a missing comma or
quote is the most common cause.
