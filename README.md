# trx-duration-report

> This Action was inspired (and lot of code comes from) by [NasAmin's trx-parser](https://github.com/NasAmin/trx-parser)

This GitHub Action provides a way of parsing dotnet test results from trx files in a given directory. The action will find trx files specified in the `TRX-PATH` input variable. This path must be accessible to the action.

It will read each individual .trx file. Loads up its data and converts it to a typed json object to make it easier to traverse through the data.
It creates one report, containing first 50 slowest unit tests.

