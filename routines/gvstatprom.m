proc(region)
  K ^gvstatinc
  D gatherdb^gvstat(,0)
  S tim=""
  SET stat=""
  FOR  SET tim=$O(^gvstatinc(region,tim)) QUIT:tim=""  DO
  .FOR  SET stat=$O(^gvstatinc(region,tim,stat)) QUIT:stat=""  DO
  ..WRITE stat_":"_^gvstatinc(region,tim,stat)_","
  ..S ^gvstatinctot(region,"tot",stat)=^gvstatinc(region,tim,stat)+$G(^gvstatinctot(region,"tot",stat),0)
  QUIT
accproc(region)
  S tim=""
  SET stat=""
  FOR  SET tim=$O(^gvstatinctot(region,tim)) QUIT:tim=""  DO
  .FOR  SET stat=$O(^gvstatinctot(region,tim,stat)) QUIT:stat=""  DO
  ..WRITE stat_":"_^gvstatinctot(region,tim,stat)_","
  QUIT

