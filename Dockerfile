FROM ubuntu:16.04
MAINTAINER Lars Windolf

RUN apt-get update
RUN apt-get install -y bash bats

RUN mkdir -p /src/
WORKDIR /src/

COPY . /src/
RUN cd tests && ./run.sh

