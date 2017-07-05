// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

export class BitArray {

    private length: number;
    private view: Uint8Array;

    constructor(buffer: ArrayBuffer, offset: number, length: number) {
        this.length = length;
        this.view = new Uint8Array(buffer, offset || 0, Math.ceil(length / 8));
    }

    get(i) {
        return this.length > 0 ? (
            // | 0 converts to an int. Math.floor works too
            this.view[(i >> 3) | 0] & (1 << (i % 8))) !== 0 :
            true;
    }

    set(i) {
        if (this.length > 0) {
            const index = (i >> 3) | 0;
            const bit = i % 8;
            this.view[index] |= 1 << bit;
        }
    }

    unset(i) {
        if (this.length > 0) {
            const index = (i >> 3) | 0;
            const bit = i % 8;
            this.view[index] &= ~(1 << bit);
        }
    }
}
