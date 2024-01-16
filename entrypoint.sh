#!/bin/bash

 . /app/app_py_env/bin/activate

 CONTENT="$(exec python3 changelog_parser.py @)"

 echo 'content<<EOF' >> $GITHUB_OUTPUT && echo $CONTENT >> $GITHUB_OUTPUT && echo 'EOF' >> $GITHUB_OUTPUT