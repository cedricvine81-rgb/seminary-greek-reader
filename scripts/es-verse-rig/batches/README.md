# Translation batches (archive)

The working batch files a translation was actually built in, kept so the work survives the
one laptop it was made on. **Nothing here is loaded by the app or by the build.** The shipped
corpus is `public/data/es/<...>/`; these are its source, one step upstream.

Keep them because `write.py` is one-way: it merges batches into per-chapter files and the
batch structure — which section was done in which pass, and the shape `check.py` verifies —
is not recoverable from the output.

What is NOT here: the `dump.py` output (`<slug>-src.txt`, the flat Greek+English dump you
translate from). That is derived from a corpus already in this repo, so it is regenerable in
one command and would only be dead weight:

    python3 scripts/es-verse-rig/dump.py diogenes-laertius

`HANDOFF.md` is the running state file for the Greco-Roman prose project — conventions,
per-book counts, the finishing checklist, and the traps found the hard way.

## diogenes-laertius/

Ten batches, `dl-b001.json` … `dl-b010.json`, one per book, 1,204 sections. Verified to
reproduce `public/data/es/greco/diogenes-laertius/` exactly:

    cd scripts/es-verse-rig/batches/diogenes-laertius
    python3 ../../write.py diogenes-laertius dl "<source>" "<note>"
