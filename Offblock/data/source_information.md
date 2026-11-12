# Source information

Fill this in at download time and do not edit it afterwards except to correct mistakes.

| Item | Value |
| --- | --- |
| Publisher | US Department of Transportation, Bureau of Transportation Statistics |
| Portal | https://www.transtats.bts.gov/ |
| Table | Reporting Carrier On-Time Performance (1987-present) |
| Table page URL | |
| Reporting periods | |
| Pilot month | |
| Download date | |
| Files used | Pre-zipped monthly files, all fields. The pipeline reads the 15 columns listed in `data_dictionary.md` |

## Files

| File name | Period | Rows | SHA-256 |
| --- | --- | --- | --- |
| | | | |

Row counts come from the import in DB Browser, not from the zip file.

Checksum on Windows: open Command Prompt in the file's folder and run

```
certutil -hashfile "filename.csv" SHA256
```

## Rules

- Files in `data/raw/` are never opened and saved, renamed after download, or edited.
- All cleaning happens in SQL, on a copy inside the database.
- If BTS is unavailable, the substitute official dataset is named here with the reason.
