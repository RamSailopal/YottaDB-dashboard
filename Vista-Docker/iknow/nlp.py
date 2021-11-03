import iknowpy
from colorama import init, Fore, Style
import mg_python

init() # init colorama

def highlight(text, language="en", iknow=iknowpy.iKnowEngine()):

    iknow.index(text, language)

    for s in iknow.m_index['sentences']:

        # first figure out where negation spans are and tag those entities
        for a in s['path_attributes']:

            # path attributes are expressed as positions within s['path'],
            # which in turn keys into the s['entities'] array
            for ent in range(s['path'][a['pos']],
                             s['path'][a['pos']+a['span']-1]+1):
                if a['type']=="Negation":
                    s['entities'][ent]['colour'] = Fore.RED
                if a['type']=="Certainty":
                    s['entities'][ent]['colour'] = Fore.CYAN
        for e in s['entities']:
            colour = Fore.BLACK
            style = Style.NORMAL

            if "colour" in e:
                colour = e["colour"]

            if (e['type'] == 'Concept'):
                style = Style.BRIGHT
                result = mg_python.m_set(0, "^NLP", text, text[e['offset_start']:e['offset_stop']], "Concept")
            if (e['type'] == 'NonRelevant') | (e['type'] == 'PathRelevant'):
                style = Style.DIM
                result = mg_python.m_set(0, "^NLP", text, text[e['offset_start']:e['offset_stop']], "NonRelevant or PathRelevant")
            print(colour + style + text[e['offset_start']:e['offset_stop']], end=' ')

        print("\n")



mg_python.m_set_host(0, "vistadocker_yottadbdash_1", 7041, "", "")
result = mg_python.m_get(0, "^LAB", "95.31", "6125", "10", "15", "0")
highlight(result)
