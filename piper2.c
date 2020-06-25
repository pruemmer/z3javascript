#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>

#define STDIN 0

int main(int argc, char *argv[]) {
  if (argc != 1) {
    printf("Expected no arguments\n");
    return 0;
  }

  
  char *res;
  int count = 256;
  char *buf = calloc(256, sizeof(char));
  
  do {
    FILE *f = fopen("whatever.txt", "r");
    res = fgets(buf, count, f);
    fclose(f);
  } while(res == NULL);
  for(int i = 0; i < count; i++){
    if (buf[i] == '\n'){
      buf[i] = '\0';
      break;
    } else if (buf[i] == '\0') {
      break;
    }
  }
  //printf("Read [%s]\n", buf);
  
  if (strcmp(buf, "sat") == 0) {
    printf("sat");
  } else if (strcmp(buf, "unsat") == 0) {
    printf("unsat");
  } else if (strcmp(buf, "unknown") == 0){
    printf("unknown");
  }
  
  return 0;
}
