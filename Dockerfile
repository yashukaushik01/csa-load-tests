FROM python:3.8-alpine as builder
WORKDIR /app

RUN apk add git && \
    apk add postgresql-dev && \
    apk add librdkafka && \
    apk add build-base && \
    apk add libffi-dev && \
    apk add librdkafka-dev && \
    apk add go && \
    apk add vim

FROM builder
WORKDIR /app

COPY . /app

ENV PATH="${PATH}:/root/go/bin"
RUN go install go.k6.io/xk6/cmd/xk6@latest
RUN xk6 build --with github.com/szkiba/xk6-dotenv@latest --with github.com/avitalique/xk6-file@latest --replace go.buf.build/grpc/go/prometheus/prometheus=buf.build/gen/go/prometheus/prometheus/protocolbuffers/go@latest --replace go.buf.build/grpc/go/gogo/protobuf=buf.build/gen/go/gogo/protobuf/protocolbuffers/go@latest

CMD ["./k6"]

ENTRYPOINT [""]