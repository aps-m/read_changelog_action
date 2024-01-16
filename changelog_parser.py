#!/usr/bin/python3

import re
import sys

__FileName = "changelog_examples/changelog.md"
__TagName = "0.0.2-b2"

def __ArgParser(input):
    global __FileName
    global __TagName

    for arg in input:
        tag = re.search(r'-[a-z]', arg)
        if tag:
            tag = tag[0]
        else:
            tag = ""
        val = arg.replace(tag, '')
        # print(f'tag: {tag}, val: {val}')
        if tag == '-f':
            __FileName = val
        if tag == '-t':
            __TagName = val

    

def __InputListBuilder():
    input_list = []
    arg_tag = None
    item = ""
    for param in sys.argv:
        if arg_tag:
            item = arg_tag[0] + param
            input_list.append(item)
            arg_tag = None
        else:   
            arg_tag = re.search(r'-[a-z]', param)
            if arg_tag:
                item = arg_tag[0]
                param = param.replace(item, '')
                if param != "":
                    input_list.append(item + param)
                    arg_tag = None
    return input_list

if __name__ == "__main__":
    input_list = __InputListBuilder()
    __ArgParser(input_list)
    # print(f'Filename: {__FileName}, tag: {__TagName}')
    
    last_tag = ""

    with open(__FileName) as f:
        for line in f:
            probe = re.search(r'[0-9]+.[0-9]+.[0-9]+[-]?[bB]?[0-9]?[0-9]?[0-9]?[0-9]?[0-9]?', line)
            if probe:
                last_tag = probe[0]
            else:
                probe = re.search(r'[\*-][\s]?[\w\s]+[;.]?', line)
                if probe:
                    if __TagName in last_tag:
                        print(line)
                        
                        
                
