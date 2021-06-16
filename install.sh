#!/bin/bash
cp routines/* "$1"
ydb <<< 'ZL "gvstat.m" ZL "gvstatprom.m" H'
