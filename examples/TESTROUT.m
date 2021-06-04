GET(CNT)
 F I=1:1:CNT  S var=^TEST(1) W !,var
 Q
SET(CNT)
 F I=1:1:CNT  S ^TEST(1)="1"
 Q

