# qute-plugin-fzfhistory

Open your history in a fzf menu  
Open in fzf the history of the last 100 recently closed tabs

Thanks to [this discussion](https://github.com/qutebrowser/qutebrowser/issues/8141) for the tip about displaying sfrtime directly with sqlite3.

## Installation
### Dependencies
The plugin need `sqlite3` installed. If you want to use another sqlite tool, edit the 'qute-plugin-fzfhistory' file and adapt the code...

```
git clone https://github.com/Twix53791/qute-plugin-fzfhistory/
cd qute-plugin-fzfhistory
cp fzfhistory-userscript ~/.config/qutebrowser/userscripts/
cp qute-plugin-fzfhistory ~/config/qutebrowser/bin/
```

* **edit `fzfhistory-userscript` to fit your config. I use for example `kitty` as a terminal, but maybe not you...**
* `qute-plugin-fzfhistory` can be copied in any bin path, for example /usr/local/bin. I have created a bin folder in qutebrowser config I added to my bin path in .zshrc (or .bashrc), but you can use your own setup.

#### To use the 'closed-tabs' extension
This extension can be launched with `spawn -u fzfhistory-userscript closed-tabs`.
It stores the last 100 closed tabs in the file 'closed-tabs-history' in the qutebrowser datadir. The patch modifies the file 'mainwindow/tabbedbrowser.py' in qutebrowser source code. You can find the location of qutebrowser files with `qutebrowser -V`.

```
patch -u /patch/to/qutebrowser/mainwindow/tabbedbrowser.py -i tabbedbrowser.patch
```

## Use
In `config.py`:
```
'h': 'spawn -u fzfhistory-userscript',
'H': 'spawn -u fzfhistory-userscript closed-tabs',
```

### Structure
`fzfhistory-userscript` run a termminal window (I recommand to make it floating for example in your window manager rules), running the command `qute-plugin-fzfhistory` which displays the content of the table `CompletionHistory` of history.sqlite, displaying the datetime in a human readable format.

## Demo

![](https://github.com/Twix53791/qute-plugin-fzfhistory/blob/main/demo.gif)
