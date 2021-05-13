# This Dockerfile is only to run TravisCI build tests

FROM ubuntu:16.04
MAINTAINER lars.windolf@gmx.de

RUN apt-get update
RUN apt-get install -y bash bats

RUN mkdir -p /src/
WORKDIR /src/

COPY . /src/

WORKDIR /src/tests/
RUN ./run.sh

