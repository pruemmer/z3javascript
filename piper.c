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

  int count = 256;
  char *buf = calloc(256, sizeof(char));
  int bytes_read = 0;
  do {
    if (bytes_read += read(STDIN, buf, count)){
      buf[bytes_read - 1] = '\0';
      bytes_read--;
      printf("Read [%s]\n", buf);
      count -= bytes_read;
      if (strcmp(buf, "sat") == 0) {
        printf("sat\n");
        break;
      } else if (strcmp(buf, "unsat") == 0) {
        printf("unsat\n");
        break;
      } else if (strcmp(buf, "unknown") == 0){
        printf("unknown\n");
        break;
      } else {
        buf += bytes_read;
      }
    }
    bytes_read = 0;
  } while (count > 0);

  
}
