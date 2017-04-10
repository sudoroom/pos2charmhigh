# pos2charmhigh

Converts KiCAD .pos placement file to Charmhigh Pick and Place CSV

## usage
```
pos2csv -i test/top.pos -f test/feeds.csv -o pnp.csv
```

### CLI
```
     -i,
    --input   KiCAD .pos file

     -o,
    --output  CSV file for the PnP

     -f,
    --feed    Feed file from PnP
```


## Feed file
The feed file is generated by the Pick and Place. Go through the normal
setup process on the machine, saving the file to the SD card. Fetch the
project file from the card. This will maintain the rest of the file as is
while updating the section pertaining to placements.
