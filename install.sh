#!/bin/bash
cp routines/* "$1"
ydb <<< 'ZL "gvstat.m" ZL "gvstat.m" H'
