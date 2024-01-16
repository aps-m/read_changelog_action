#!/bin/bash

 . /app/app_py_env/bin/activate

 CONTENT="$(exec python3 /app/changelog_parser.py $@)"

 echo 'CONTENT<<EOF' >> $GITHUB_OUTPUT && echo "$CONTENT" >> $GITHUB_OUTPUT && echo 'EOF' >> $GITHUB_OUTPUT